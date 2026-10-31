import express from 'express';
import {
    getAllPromises,
    createPromise,
    updatePromiseStatus,
    getPromiseStats,
    getPromiseCategories,
    createCategory,
    updatePromise,
    deletePromise
} from '../services/promise.service';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { db } from '../index';

const router = express.Router();

/**
 * @swagger
 * /api/promises/stats:
 *   get:
 *     summary: Get promise statistics for dashboard
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/stats', authenticateJWT, async (req, res) => {
    try {
        const user = (req as any).user;
        const userRole = user?.role;
        const userId = user?.userId;
        const organizationId = user?.organizationId;
        const isSuperAdmin = organizationId === null || organizationId === undefined;
        
        // Check if user is an Agent
        const isAgent = userRole === 'Agent' || (typeof userRole === 'object' && userRole?.name === 'Agent');
        
        // For Agents: filter stats by their userId
        // For others: use organizationId from query or user's organizationId
        let orgId: number | undefined;
        let agentUserId: number | undefined;
        
        if (isAgent && userId) {
            agentUserId = userId;
        } else {
            // Non-super-admin: always use own organizationId (ignore query for safety)
            orgId = organizationId || undefined;
            if (isSuperAdmin) {
                orgId = req.query.organizationId
                    ? Number.parseInt(req.query.organizationId as string)
                    : undefined;
            }
        }
        
        const stats = await getPromiseStats(orgId, agentUserId);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/promises/categories
 * Returns list of available categories for dropdowns.
 */
router.get('/categories', authenticateJWT, async (_req, res) => {
    try {
        const categories = await getPromiseCategories();
        res.json(categories);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch categories' });
    }
});

/**
 * POST /api/promises/categories
 * Create a new category.
 */
router.post('/categories', authenticateJWT, async (req, res) => {
    try {
        const { name } = req.body;
        const category = await createCategory(name);
        res.status(201).json(category);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to create category' });
    }
});

/**
 * @swagger
 * /api/promises:
 *   get:
 *     summary: Get all promises with filtering
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of promises
 */
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const user = (req as any).user;
        const userRole = user?.role;
        const userId = user?.userId;
        const organizationId = user?.organizationId;
        const isSuperAdmin = organizationId === null || organizationId === undefined;
        
        // Check if user is an Agent
        const isAgent = userRole === 'Agent' || (typeof userRole === 'object' && userRole?.name === 'Agent');
        
        const filters: any = { ...req.query };
        
        // For Agents: force filter by their userId
        if (isAgent && userId) {
            filters.userId = userId.toString();
        }
        // For non-super-admin: force filter by their organization
        if (!isSuperAdmin && organizationId) {
            filters.organizationId = organizationId.toString();
        }

        const promises = await getAllPromises(filters);
        res.json(promises);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/promises:
 *   post:
 *     summary: Create a new promise manually
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateJWT, async (req, res) => {
    try {
        const user = (req as any).user;
        const userRole = user?.role;
        const requesterUserId = user?.userId;
        const organizationId = user?.organizationId;
        const isSuperAdmin = organizationId === null || organizationId === undefined;

        const isAgent = userRole === 'Agent' || (typeof userRole === 'object' && userRole?.name === 'Agent');

        const { title, description, status, dueDate, userId, categoryId } = req.body || {};
        if (!title || !dueDate) {
            return res.status(400).json({ error: 'title and dueDate are required' });
        }

        // Determine assignee
        const assignedUserId = isAgent
            ? requesterUserId
            : (userId ?? requesterUserId);

        if (!assignedUserId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Security: non-super-admin can only assign within their org
        if (!isSuperAdmin) {
            const assignee = await db.user.findUnique({
                where: { id: Number(assignedUserId) },
                select: { organizationId: true }
            });
            if (!assignee || assignee.organizationId !== organizationId) {
                return res.status(403).json({ error: 'Forbidden: invalid assignee' });
            }
        }

        const promise = await createPromise({
            title,
            description: description || null,
            status,
            dueDate,
            userId: Number(assignedUserId),
            categoryId: categoryId ?? null
        });
        res.status(201).json(promise);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/promises/{id}/status:
 *   patch:
 *     summary: Update promise status
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = (req as any).user;
        const userRole = user?.role;
        const requesterUserId = user?.userId;
        const organizationId = user?.organizationId;
        const isSuperAdmin = organizationId === null || organizationId === undefined;
        const isAgent = userRole === 'Agent' || (typeof userRole === 'object' && userRole?.name === 'Agent');

        const targetId = Number.parseInt(id);
        const existing = await db.promise.findUnique({
            where: { id: targetId },
            include: { user: { select: { id: true, organizationId: true } } }
        });
        if (!existing) return res.status(404).json({ error: 'Promise not found' });

        if (isAgent && existing.userId !== requesterUserId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (!isSuperAdmin && existing.user?.organizationId !== organizationId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const promise = await updatePromiseStatus(targetId, status);
        res.json(promise);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/promises/:id
 * Update promise details (admin) or own promise (agent) within org.
 */
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
        const targetId = Number.parseInt(req.params.id);
        const user = (req as any).user;
        const userRole = user?.role;
        const requesterUserId = user?.userId;
        const organizationId = user?.organizationId;
        const isSuperAdmin = organizationId === null || organizationId === undefined;
        const isAgent = userRole === 'Agent' || (typeof userRole === 'object' && userRole?.name === 'Agent');

        const existing = await db.promise.findUnique({
            where: { id: targetId },
            include: { user: { select: { id: true, organizationId: true } } }
        });
        if (!existing) return res.status(404).json({ error: 'Promise not found' });

        if (isAgent && existing.userId !== requesterUserId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (!isSuperAdmin && existing.user?.organizationId !== organizationId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const updates = req.body || {};
        // Agents cannot reassign ownership
        if (isAgent) {
            delete updates.userId;
        }

        // Non-super-admin cannot assign to other org
        if (!isSuperAdmin && updates.userId) {
            const assignee = await db.user.findUnique({
                where: { id: Number(updates.userId) },
                select: { organizationId: true }
            });
            if (!assignee || assignee.organizationId !== organizationId) {
                return res.status(403).json({ error: 'Forbidden: invalid assignee' });
            }
        }

        const updated = await updatePromise(targetId, updates);
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to update promise' });
    }
});

/**
 * DELETE /api/promises/:id
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
    try {
        const targetId = Number.parseInt(req.params.id);
        const user = (req as any).user;
        const userRole = user?.role;
        const requesterUserId = user?.userId;
        const organizationId = user?.organizationId;
        const isSuperAdmin = organizationId === null || organizationId === undefined;
        const isAgent = userRole === 'Agent' || (typeof userRole === 'object' && userRole?.name === 'Agent');

        const existing = await db.promise.findUnique({
            where: { id: targetId },
            include: { user: { select: { id: true, organizationId: true } } }
        });
        if (!existing) return res.status(404).json({ error: 'Promise not found' });

        if (isAgent && existing.userId !== requesterUserId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (!isSuperAdmin && existing.user?.organizationId !== organizationId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await deletePromise(targetId);
        res.json({ message: 'Promise deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to delete promise' });
    }
});

export default router;
