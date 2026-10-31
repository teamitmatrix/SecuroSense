import { Router } from 'express';
import {
    getAllGlobalParameters,
    createGlobalParameter,
    updateGlobalParameter,
    deleteGlobalParameter
} from '../services/qa-parameter.service';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/permission.middleware';
import { PERMISSIONS } from '../services/permission.service';

const router = Router();

router.use(authenticateJWT);

/**
 * @swagger
 * /api/qa-parameters:
 *   get:
 *     summary: Get all global QA parameters
 *     tags: [QA Parameters]
 */
router.get('/', requirePermission(PERMISSIONS.VIEW_QA_TEMPLATES), async (req, res) => {
    try {
        const { industry } = req.query;
        const organizationId = (req as any).user?.organizationId;
        const params = await getAllGlobalParameters(industry as string, organizationId);
        res.json(params);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch parameters' });
    }
});

/**
 * @swagger
 * /api/qa-parameters:
 *   post:
 *     summary: Create new global QA parameter
 *     tags: [QA Parameters]
 */
router.post('/', requirePermission(PERMISSIONS.MANAGE_QA_TEMPLATES), async (req, res) => {
    try {
        const organizationId = (req as any).user?.organizationId;
        const param = await createGlobalParameter(req.body, organizationId);
        res.status(201).json(param);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create parameter' });
    }
});

/**
 * @swagger
 * /api/qa-parameters/{id}:
 *   put:
 *     summary: Update global QA parameter
 *     tags: [QA Parameters]
 */
router.put('/:id', requirePermission(PERMISSIONS.MANAGE_QA_TEMPLATES), async (req, res) => {
    try {
        const organizationId = (req as any).user?.organizationId;
        const param = await updateGlobalParameter(Number.parseInt(req.params.id), req.body, organizationId);
        res.json(param);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update parameter' });
    }
});

/**
 * @swagger
 * /api/qa-parameters/{id}:
 *   delete:
 *     summary: Delete global QA parameter
 *     tags: [QA Parameters]
 */
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_QA_TEMPLATES), async (req, res) => {
    try {
        await deleteGlobalParameter(Number.parseInt(req.params.id));
        res.json({ message: 'Parameter deleted' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to delete parameter' });
    }
});

export default router;
