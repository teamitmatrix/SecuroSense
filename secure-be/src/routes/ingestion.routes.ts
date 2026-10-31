import { Router } from 'express';
import { syncCalls } from '../services/ingestion.service';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/ingestion/trigger-sync:
 *   post:
 *     summary: Trigger manual call sync
 *     description: Manually trigger synchronization of calls from external systems
 *     tags: [Data Ingestion]
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sync completed"
 *                 processed:
 *                   type: integer
 *                   example: 5
 *                 calls:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Call'
 *       500:
 *         description: Sync failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/trigger-sync', async (req, res) => {
    try {
        logger.info('Manual sync triggered via API');
        const results = await syncCalls();
        logger.info('Sync completed successfully', { processed: results.length });
        res.json({ message: "Sync completed", processed: results.length, calls: results });
    } catch (error) {
        logger.error('Sync failed', { error });
        res.status(500).json({ error: "Sync failed" });
    }
});

export default router;
