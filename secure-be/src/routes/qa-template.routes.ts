import { Router } from 'express';
import {
    createQATemplate,
    getAllQATemplates,
    getQATemplateById,
    updateQATemplate,
    deleteQATemplate,
    seedDefaultTemplates,
    copyTemplateToOrganization,
    getOrganizationQATemplate
} from '../services/qa-template.service';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requirePermission, requireAdmin } from '../middlewares/permission.middleware';
import { PERMISSIONS } from '../services/permission.service';
import { logAuditEvent } from '../services/audit.service';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

/**
 * @swagger
 * /api/qa-templates:
 *   get:
 *     summary: Get all QA templates
 *     tags: [QA Templates]
 *     parameters:
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 */
router.get('/', requirePermission(PERMISSIONS.VIEW_QA_TEMPLATES), async (req, res) => {
    try {
        const { industry, includeUsage } = req.query;
        const user = (req as any).user;
        const isSuperAdmin = !user.organizationId;
        
        // For super_admin, include usage information (which organizations are using each template)
        const templates = await getAllQATemplates(
            industry as string, 
            user.organizationId, 
            isSuperAdmin && includeUsage === 'true'
        );

        await logAuditEvent({
            userId: (req as any).user.userId,
            action: 'VIEW_QA_TEMPLATES',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json(templates);
    } catch (error: any) {
        logger.error('Failed to fetch QA templates', { error });
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

/**
 * @swagger
 * /api/qa-templates/{id}:
 *   get:
 *     summary: Get QA template by ID
 *     tags: [QA Templates]
 */
router.get('/:id', requirePermission(PERMISSIONS.VIEW_QA_TEMPLATES), async (req, res) => {
    try {
        const template = await getQATemplateById(Number.parseInt(req.params.id));
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        await logAuditEvent({
            userId: (req as any).user.userId,
            action: 'VIEW_QA_TEMPLATE',
            resource: `QATemplate:${req.params.id}`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json(template);
    } catch (error: any) {
        logger.error('Failed to fetch QA template', { error, templateId: req.params.id });
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

/**
 * @swagger
 * /api/qa-templates/{id}/copy:
 *   post:
 *     summary: Copy template to organization (Organization Admin)
 *     tags: [QA Templates]
 */
router.post('/:id/copy', requirePermission(PERMISSIONS.VIEW_QA_TEMPLATES), async (req, res) => {
    try {
        const templateId = Number.parseInt(req.params.id);
        const user = (req as any).user;
        const organizationId = user.organizationId;

        if (!organizationId) {
            return res.status(403).json({ error: 'Only organization admins can copy templates' });
        }

        const copiedTemplate = await copyTemplateToOrganization(templateId, organizationId, user.userId);

        await logAuditEvent({
            userId: user.userId,
            action: 'COPY_QA_TEMPLATE',
            resource: `QATemplate:${templateId}`,
            details: { newTemplateId: copiedTemplate.id },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(201).json(copiedTemplate);
    } catch (error: any) {
        logger.error('Failed to copy template', { error });
        res.status(500).json({ error: error.message || 'Failed to copy template' });
    }
});

/**
 * @swagger
 * /api/qa-templates/organization/me:
 *   get:
 *     summary: Get organization's QA template (for call analysis)
 *     tags: [QA Templates]
 */
router.get('/organization/me', requirePermission(PERMISSIONS.VIEW_QA_TEMPLATES), async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user.organizationId;

        if (!organizationId) {
            return res.status(403).json({ error: 'Organization ID required' });
        }

        const template = await getOrganizationQATemplate(organizationId);

        if (!template) {
            return res.status(404).json({ error: 'No QA template found for your organization' });
        }

        res.json(template);
    } catch (error: any) {
        logger.error('Failed to fetch organization template', { error });
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

/**
 * @swagger
 * /api/qa-templates:
 *   post:
 *     summary: Create new QA template (super_admin or organization admin)
 *     tags: [QA Templates]
 */
router.post('/', requirePermission(PERMISSIONS.VIEW_QA_TEMPLATES), async (req, res) => {
    try {
        const { name, nameAr, description, industry, parameters, organizationId } = req.body;
        const user = (req as any).user;
        const isSuperAdmin = user.organizationId === null || user.organizationId === undefined;

        if (!name || !industry || !parameters || !Array.isArray(parameters)) {
            return res.status(400).json({
                error: 'Missing required fields: name, industry, parameters (array)'
            });
        }

        // Super_admin can create templates for specific organizations or global (null)
        // Organization admin can only create templates for their own organization
        let templateOrganizationId: number | null;
        
        if (isSuperAdmin) {
            // Super admin: can create global (null) or for specific organization
            templateOrganizationId = organizationId ?? null;
        } else {
            // Organization admin: can only create for their own organization
            if (organizationId && organizationId !== user.organizationId) {
                return res.status(403).json({ error: 'You can only create templates for your own organization' });
            }
            templateOrganizationId = user.organizationId;
        }

        const template = await createQATemplate({
            name,
            nameAr,
            description,
            industry,
            parameters,
            createdBy: user.userId,
            organizationId: templateOrganizationId
        });

        await logAuditEvent({
            userId: user.userId,
            action: 'CREATE_QA_TEMPLATE',
            resource: `QATemplate:${template.id}`,
            details: { name, industry },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(201).json(template);
    } catch (error: any) {
        logger.error('Failed to create QA template', { error });
        res.status(500).json({ error: 'Failed to create template' });
    }
});

/**
 * @swagger
 * /api/qa-templates/{id}:
 *   put:
 *     summary: Update QA template (super_admin or organization admin for their own templates)
 *     tags: [QA Templates]
 */
router.put('/:id', requirePermission(PERMISSIONS.VIEW_QA_TEMPLATES), async (req, res) => {
    try {
        const templateId = Number.parseInt(req.params.id);
        const { name, nameAr, description, industry, parameters, organizationId } = req.body;
        const user = (req as any).user;
        const isSuperAdmin = user.organizationId === null || user.organizationId === undefined;

        // Check if user can edit this template
        const existingTemplate = await getQATemplateById(templateId);
        if (!existingTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Organization admin can only edit their own organization's templates
        if (!isSuperAdmin && existingTemplate.organizationId !== user.organizationId) {
            return res.status(403).json({ error: 'You can only edit templates belonging to your organization' });
        }

        // Super admin can change organizationId, org admin cannot
        const updateData: any = {
            name,
            nameAr,
            description,
            industry,
            parameters
        };

        if (isSuperAdmin && organizationId !== undefined) {
            updateData.organizationId = organizationId;
        }

        const template = await updateQATemplate(templateId, updateData);

        await logAuditEvent({
            userId: user.userId,
            action: 'UPDATE_QA_TEMPLATE',
            resource: `QATemplate:${templateId}`,
            details: { name, industry },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json(template);
    } catch (error: any) {
        logger.error('Failed to update QA template', { error, templateId: req.params.id });
        res.status(500).json({ error: 'Failed to update template' });
    }
});

/**
 * @swagger
 * /api/qa-templates/{id}:
 *   delete:
 *     summary: Delete (deactivate) QA template (super_admin or organization admin for their own templates)
 *     tags: [QA Templates]
 */
router.delete('/:id', requirePermission(PERMISSIONS.VIEW_QA_TEMPLATES), async (req, res) => {
    try {
        const templateId = Number.parseInt(req.params.id);
        const user = (req as any).user;
        const isSuperAdmin = user.organizationId === null || user.organizationId === undefined;

        // Check if user can delete this template
        const existingTemplate = await getQATemplateById(templateId);
        if (!existingTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Organization admin can only delete their own organization's templates
        if (!isSuperAdmin && existingTemplate.organizationId !== user.organizationId) {
            return res.status(403).json({ error: 'You can only delete templates belonging to your organization' });
        }

        await deleteQATemplate(templateId);

        await logAuditEvent({
            userId: user.userId,
            action: 'DELETE_QA_TEMPLATE',
            resource: `QATemplate:${templateId}`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({ message: 'Template deactivated successfully' });
    } catch (error: any) {
        logger.error('Failed to delete QA template', { error, templateId: req.params.id });
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

/**
 * @swagger
 * /api/qa-templates/seed:
 *   post:
 *     summary: Seed default QA templates (Admin only)
 *     tags: [QA Templates]
 */
router.post('/seed', requireAdmin, async (req, res) => {
    try {
        await seedDefaultTemplates();

        await logAuditEvent({
            userId: (req as any).user.userId,
            action: 'SEED_QA_TEMPLATES',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({ message: 'Default templates seeded successfully' });
    } catch (error: any) {
        logger.error('Failed to seed templates', { error });
        res.status(500).json({ error: 'Failed to seed templates' });
    }
});

export default router;
