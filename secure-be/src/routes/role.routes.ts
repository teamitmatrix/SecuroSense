import { Router } from 'express';
import {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole,
    seedDefaultRoles
} from '../services/role.service';
import { listAllPermissions, PERMISSIONS } from '../services/permission.service';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requirePermission, requireAdmin } from '../middlewares/permission.middleware';
import { logAuditEvent } from '../services/audit.service';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     summary: Get all available permissions
 *     tags: [Roles]
 */
router.get('/permissions', async (req, res) => {
    try {
        const organizationId = (req as any).user?.organizationId;
        const permissions = await listAllPermissions(organizationId);
        res.json(permissions);
    } catch (error: any) {
        logger.error('Failed to fetch permissions', { error });
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
});

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles with permissions
 *     tags: [Roles]
 */
router.get('/', async (req, res) => {
    try {
        const organizationId = (req as any).user?.organizationId;
        const userRole = (req as any).user?.role;
        const roles = await getAllRoles(organizationId, userRole);

        await logAuditEvent({
            userId: (req as any).user.userId,
            action: 'VIEW_ROLES',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json(roles);
    } catch (error: any) {
        logger.error('Failed to fetch roles', { error });
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID with permissions and users
 *     tags: [Roles]
 */
router.get('/:id', async (req, res) => {
    try {
        const role = await getRoleById(Number.parseInt(req.params.id));

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        await logAuditEvent({
            userId: (req as any).user.userId,
            action: 'VIEW_ROLE',
            resource: `Role:${req.params.id}`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json(role);
    } catch (error: any) {
        logger.error('Failed to fetch role', { error, roleId: req.params.id });
        res.status(500).json({ error: 'Failed to fetch role' });
    }
});

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create new role with permissions
 *     tags: [Roles]
 */
router.post('/', requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
        const { name, description, permissions, targetOrganizationId } = req.body;
        const userOrganizationId = (req as any).user?.organizationId;
        const userRole = (req as any).user?.role;

        if (!name || !permissions || !Array.isArray(permissions)) {
            return res.status(400).json({
                error: 'Missing required fields: name, permissions (array)'
            });
        }

        // Determine the organizationId for the role
        let roleOrganizationId: number | null = null;
        
        // Check if user is super_admin
        const isSuperAdmin = (userOrganizationId === null || userOrganizationId === undefined) ||
                           userRole === 'super_admin' || 
                           userRole?.toLowerCase() === 'super admin';
        
        if (isSuperAdmin) {
            // Super admin can create:
            // 1. System roles (targetOrganizationId = null or not provided)
            // 2. Organization-specific roles (targetOrganizationId = number)
            roleOrganizationId = targetOrganizationId === undefined ? null : targetOrganizationId;
        } else {
            // Regular admins can only create roles for their own organization
            roleOrganizationId = userOrganizationId;
        }

        const role = await createRole({
            name,
            description,
            permissions,
            organizationId: roleOrganizationId
        });

        await logAuditEvent({
            userId: (req as any).user.userId,
            action: 'CREATE_ROLE',
            resource: `Role:${role.id}`,
            details: { name, permissionCount: permissions.length },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(201).json(role);
    } catch (error: any) {
        logger.error('Failed to create role', { error });
        res.status(500).json({ error: 'Failed to create role' });
    }
});

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update role and its permissions
 *     tags: [Roles]
 */
router.put('/:id', requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const organizationId = (req as any).user?.organizationId;
        
        // Check if role belongs to organization (unless super_admin)
        if (organizationId !== null && organizationId !== undefined) {
            const existingRole: any = await getRoleById(Number.parseInt(req.params.id));
            if (existingRole && existingRole.organizationId !== organizationId && existingRole.organizationId !== null) {
                return res.status(403).json({ error: 'You can only edit roles from your organization' });
            }
        }

        const role = await updateRole(Number.parseInt(req.params.id), {
            name,
            description,
            permissions
        });

        await logAuditEvent({
            userId: (req as any).user.userId,
            action: 'UPDATE_ROLE',
            resource: `Role:${req.params.id}`,
            details: { name },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json(role);
    } catch (error: any) {
        logger.error('Failed to update role', { error, roleId: req.params.id });
        res.status(500).json({ error: error.message || 'Failed to update role' });
    }
});

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete role (if not system role and not assigned to users)
 *     tags: [Roles]
 */
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
        const organizationId = (req as any).user?.organizationId;
        
        // Check if role belongs to organization (unless super_admin)
        if (organizationId !== null && organizationId !== undefined) {
            const existingRole: any = await getRoleById(Number.parseInt(req.params.id));
            if (existingRole && existingRole.organizationId !== organizationId && existingRole.organizationId !== null) {
                return res.status(403).json({ error: 'You can only delete roles from your organization' });
            }
        }
        
        await deleteRole(Number.parseInt(req.params.id));

        await logAuditEvent({
            userId: (req as any).user.userId,
            action: 'DELETE_ROLE',
            resource: `Role:${req.params.id}`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({ message: 'Role deleted successfully' });
    } catch (error: any) {
        logger.error('Failed to delete role', { error, roleId: req.params.id });
        res.status(400).json({ error: error.message || 'Failed to delete role' });
    }
});

/**
 * @swagger
 * /api/roles/seed:
 *   post:
 *     summary: Seed default system roles (Admin only)
 *     tags: [Roles]
 */
router.post('/seed', requireAdmin, async (req, res) => {
    try {
        await seedDefaultRoles();

        await logAuditEvent({
            userId: (req as any).user.userId,
            action: 'SEED_ROLES',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({ message: 'Default roles seeded successfully' });
    } catch (error: any) {
        logger.error('Failed to seed roles', { error });
        res.status(500).json({ error: 'Failed to seed roles' });
    }
});

export default router;
