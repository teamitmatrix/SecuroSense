// backend/src/routes/organization.routes.ts
import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requirePermission, AuthenticatedRequest } from '../middlewares/permission.middleware';
import { PERMISSIONS } from '../services/permission.service';
import {
    getAllOrganizations,
    getOrganizationById,
    updateOrganizationAdminPermissions,
    getOrganizationAdminPermissionsCached as getOrganizationAdminPermissions,
    createAdminUserForOrganization,
    createOrganization,
    CreateOrganizationInput
} from '../services/organization.service';
import { db } from '../index';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get all organizations with admin email (super_admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all organizations
 *       403:
 *         description: Forbidden - Only super_admin can access
 */
router.get('/', requirePermission(PERMISSIONS.MANAGE_ORGANIZATIONS), async (req: AuthenticatedRequest, res) => {
    try {
        const organizations = await getAllOrganizations();
        logger.info('Organizations list retrieved', {
            userId: req.user?.userId,
            count: organizations.length
        });
        res.json(organizations);
    } catch (error: any) {
        logger.error('Failed to get organizations', { error });
        res.status(500).json({ error: 'Failed to retrieve organizations' });
    }
});

/**
 * @swagger
 * /api/organizations/me:
 *   get:
 *     summary: Get current user's organization details
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization details
 *       403:
 *         description: Forbidden - User does not have an organization
 *       404:
 *         description: Organization not found
 */
router.get('/me', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get user from database to ensure we have the latest organizationId
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { organizationId: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userOrganizationId = user.organizationId;
        
        if (!userOrganizationId) {
            return res.status(403).json({ 
                error: 'You do not have an organization assigned' 
            });
        }

        const organization = await getOrganizationById(userOrganizationId);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        logger.info('Organization retrieved (me)', {
            userId: userId,
            organizationId: userOrganizationId
        });
        res.json(organization);
    } catch (error: any) {
        logger.error('Failed to get organization (me)', { error, userId: req.user?.userId });
        res.status(500).json({ error: 'Failed to retrieve organization' });
    }
});

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization by ID with admin details (super_admin can view any, regular users can view their own)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Organization details
 *       403:
 *         description: Forbidden - Regular users can only view their own organization
 *       404:
 *         description: Organization not found
 */
router.get('/:id', async (req: AuthenticatedRequest, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid organization ID' });
        }

        // Check if user is super_admin or if they're accessing their own organization
        const userRole = req.user?.role;
        const userOrganizationId = req.user?.organizationId;
        
        // Allow super_admin to view any organization
        // For regular users (admin, agents, etc.), allow them to view their own organization
        if (userRole !== 'super_admin' && userRole !== 'Super Admin') {
            // If user has an organizationId, they can only view their own
            if (userOrganizationId) {
                // Convert both to numbers for comparison
                const userOrgId = typeof userOrganizationId === 'string' 
                    ? parseInt(userOrganizationId) 
                    : userOrganizationId;
                
                if (userOrgId !== id) {
                    return res.status(403).json({ 
                        error: 'You can only view your own organization information' 
                    });
                }
            } else {
                // User without organizationId cannot view any organization
                return res.status(403).json({ 
                    error: 'You do not have access to organization information' 
                });
            }
        }

        const organization = await getOrganizationById(id);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        logger.info('Organization retrieved', {
            userId: req.user?.userId,
            organizationId: id,
            userRole: userRole
        });
        res.json(organization);
    } catch (error: any) {
        logger.error('Failed to get organization', { error });
        res.status(500).json({ error: 'Failed to retrieve organization' });
    }
});

/**
 * @swagger
 * /api/organizations/{id}/admin/permissions:
 *   get:
 *     summary: Get organization admin's current permissions (super_admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin permissions
 *       403:
 *         description: Forbidden - Only super_admin can access
 */
router.get('/:id/admin/permissions', requirePermission(PERMISSIONS.MANAGE_ORGANIZATIONS), async (req: AuthenticatedRequest, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid organization ID' });
        }

        const permissions = await getOrganizationAdminPermissions(id);
        logger.info('Organization admin permissions retrieved', {
            userId: req.user?.userId,
            organizationId: id
        });
        res.json(permissions);
    } catch (error: any) {
        logger.error('Failed to get admin permissions', { error });
        if (error.message === 'Organization not found' || error.message.includes('No Admin user')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to retrieve admin permissions' });
    }
});

/**
 * @swagger
 * /api/organizations/{id}/admin/permissions:
 *   put:
 *     summary: Update organization admin's permissions (super_admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 *       403:
 *         description: Forbidden - Only super_admin can access
 *       404:
 *         description: Organization not found
 */
router.put('/:id/admin/permissions', requirePermission(PERMISSIONS.MANAGE_ORGANIZATIONS), async (req: AuthenticatedRequest, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid organization ID' });
        }

        const { permissions } = req.body;
        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: 'Permissions must be an array' });
        }

        if (!req.user?.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await updateOrganizationAdminPermissions(
            id,
            permissions,
            req.user.userId
        );

        logger.info('Organization admin permissions updated', {
            userId: req.user.userId,
            organizationId: id,
            permissionCount: permissions.length
        });

        res.json({
            message: 'Permissions updated successfully',
            ...result
        });
    } catch (error: any) {
        logger.error('Failed to update admin permissions', { error });
        if (error.message === 'Organization not found' || error.message.includes('No Admin user')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update admin permissions' });
    }
});

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create a new organization (super_admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - industry
 *             properties:
 *               name:
 *                 type: string
 *               industry:
 *                 type: string
 *               size:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               country:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               address:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               description:
 *                 type: string
 *               timezone:
 *                 type: string
 *               taxId:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               foundedYear:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       400:
 *         description: Invalid input or organization already exists
 *       403:
 *         description: Forbidden - Only super_admin can access
 */
router.post('/', requirePermission(PERMISSIONS.MANAGE_ORGANIZATIONS), async (req: AuthenticatedRequest, res) => {
    try {
        const input: CreateOrganizationInput = req.body;

        if (!input.name || !input.industry) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, industry' 
            });
        }

        const organization = await createOrganization(input);

        logger.info('Organization created', {
            userId: req.user?.userId,
            organizationId: organization.id,
            name: organization.name
        });

        res.status(201).json({
            message: 'Organization created successfully',
            organization
        });
    } catch (error: any) {
        logger.error('Failed to create organization', { error });
        if (error.message === 'Organization with this name already exists') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create organization' });
    }
});

/**
 * @swagger
 * /api/organizations/create-admin:
 *   post:
 *     summary: Create admin user for specific organization (super_admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - email
 *               - password
 *               - name
 *             properties:
 *               organizationId:
 *                 type: integer
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *       400:
 *         description: Invalid input or user already exists
 *       403:
 *         description: Forbidden - Only super_admin can access
 */
router.post('/create-admin', requirePermission(PERMISSIONS.MANAGE_ORGANIZATIONS), async (req: AuthenticatedRequest, res) => {
    try {
        const { organizationId, email, password, name } = req.body;

        if (!organizationId || !email || !password || !name) {
            return res.status(400).json({ 
                error: 'Missing required fields: organizationId, email, password, name' 
            });
        }

        const result = await createAdminUserForOrganization(
            parseInt(organizationId),
            email,
            password,
            name
        );

        logger.info('Admin user created for organization', {
            userId: req.user?.userId,
            organizationId,
            adminEmail: email
        });

        res.status(201).json({
            message: 'Admin user created successfully',
            ...result
        });
    } catch (error: any) {
        logger.error('Failed to create admin user', { error });
        if (error.message === 'Organization not found' || 
            error.message === 'User with this email already exists' ||
            error.message === 'Admin role not found') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create admin user' });
    }
});

export default router;

