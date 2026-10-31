// backend/src/routes/data-retention.routes.ts
import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { filterByOrganization } from '../middlewares/organization.middleware';
import { requirePermission } from '../middlewares/permission.middleware';
import { PERMISSIONS } from '../services/permission.service';
import { applyRetentionPolicy, getRetentionStatus } from '../services/data-retention.service';
import { db } from '../index';
import logger from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /api/data-retention/policies:
 *   get:
 *     summary: Get data retention policies for organization
 *     tags: [Data Retention]
 *     security:
 *       - bearerAuth: []
 */
router.get('/policies', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user?.organizationId;

        if (organizationId === null || organizationId === undefined) {
            return res.status(400).json({ error: 'Organization ID required' });
        }

        const policies = await db.dataRetentionPolicy.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(policies);
    } catch (error) {
        logger.error('Failed to fetch retention policies', { error });
        res.status(500).json({ error: 'Failed to fetch retention policies' });
    }
});

/**
 * @swagger
 * /api/data-retention/policies:
 *   post:
 *     summary: Create data retention policy
 *     tags: [Data Retention]
 *     security:
 *       - bearerAuth: []
 */
router.post('/policies', authenticateJWT, filterByOrganization, requirePermission(PERMISSIONS.MANAGE_SETTINGS), async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user?.organizationId;
        const { dataType, retentionPeriodDays, autoDeleteEnabled } = req.body;

        if (!dataType || !retentionPeriodDays) {
            return res.status(400).json({ error: 'dataType and retentionPeriodDays are required' });
        }

        if (organizationId === null || organizationId === undefined) {
            return res.status(400).json({ error: 'Organization ID required' });
        }

        // Check if policy already exists for this dataType
        const existing = await db.dataRetentionPolicy.findUnique({
            where: {
                organizationId_dataType: {
                    organizationId,
                    dataType
                }
            }
        });

        let policy;
        if (existing) {
            // Update existing policy
            policy = await db.dataRetentionPolicy.update({
                where: { id: existing.id },
                data: {
                    retentionPeriodDays,
                    autoDeleteEnabled: autoDeleteEnabled !== undefined ? autoDeleteEnabled : false
                }
            });
        } else {
            // Create new policy
            policy = await db.dataRetentionPolicy.create({
                data: {
                    organizationId,
                    dataType,
                    retentionPeriodDays,
                    autoDeleteEnabled: autoDeleteEnabled !== undefined ? autoDeleteEnabled : false
                }
            });
        }

        res.status(201).json(policy);
    } catch (error) {
        logger.error('Failed to create retention policy', { error });
        res.status(500).json({ error: 'Failed to create retention policy' });
    }
});

/**
 * @swagger
 * /api/data-retention/status:
 *   get:
 *     summary: Get retention status for organization
 *     tags: [Data Retention]
 *     security:
 *       - bearerAuth: []
 */
router.get('/status', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user?.organizationId;

        if (organizationId === null || organizationId === undefined) {
            return res.status(400).json({ error: 'Organization ID required' });
        }

        const status = await getRetentionStatus(organizationId);
        res.json(status);
    } catch (error) {
        logger.error('Failed to get retention status', { error });
        res.status(500).json({ error: 'Failed to get retention status' });
    }
});

/**
 * @swagger
 * /api/data-retention/cleanup:
 *   post:
 *     summary: Trigger manual cleanup (admin only)
 *     tags: [Data Retention]
 *     security:
 *       - bearerAuth: []
 */
router.post('/cleanup', authenticateJWT, filterByOrganization, requirePermission(PERMISSIONS.MANAGE_SETTINGS), async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user?.organizationId;

        if (organizationId === null || organizationId === undefined) {
            return res.status(400).json({ error: 'Organization ID required' });
        }

        const result = await applyRetentionPolicy(organizationId);

        res.json({
            message: 'Cleanup completed',
            ...result
        });
    } catch (error) {
        logger.error('Failed to trigger cleanup', { error });
        res.status(500).json({ error: 'Failed to trigger cleanup' });
    }
});

export default router;

