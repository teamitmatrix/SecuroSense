import express from 'express';
import { getDashboardStats, getTeamPerformance, getRevenueDistribution } from '../services/sales.service';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { filterByOrganization } from '../middlewares/organization.middleware';

const router = express.Router();

function parseOptionalDate(input: unknown): Date | undefined {
    if (!input) return undefined;
    const value = Array.isArray(input) ? input[0] : input;
    if (typeof value !== 'string') return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d;
}

/**
 * @swagger
 * /api/sales/stats:
 *   get:
 *     summary: Get overall sales dashboard statistics
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        // Get organizationId from query (set by filterByOrganization middleware)
        // For super_admin, organizationId will be null/undefined (sees all)
        // For regular admins, organizationId will be their organization
        const organizationId = req.query.organizationId 
            ? Number.parseInt(req.query.organizationId as string) 
            : (req as any).organizationId;

        const startDate = parseOptionalDate(req.query.startDate);
        const endDate = parseOptionalDate(req.query.endDate);
        
        const stats = await getDashboardStats(organizationId, startDate, endDate);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/sales/team-performance:
 *   get:
 *     summary: Get revenue breakdown by team
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 */
router.get('/team-performance', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const organizationId = req.query.organizationId 
            ? Number.parseInt(req.query.organizationId as string) 
            : (req as any).organizationId;

        const startDate = parseOptionalDate(req.query.startDate);
        const endDate = parseOptionalDate(req.query.endDate);
        
        const result = await getTeamPerformance(organizationId, startDate, endDate);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/sales/distribution:
 *   get:
 *     summary: Get revenue distribution by source
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 */
router.get('/distribution', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const organizationId = req.query.organizationId 
            ? Number.parseInt(req.query.organizationId as string) 
            : (req as any).organizationId;

        const startDate = parseOptionalDate(req.query.startDate);
        const endDate = parseOptionalDate(req.query.endDate);
        
        const result = await getRevenueDistribution(organizationId, startDate, endDate);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
