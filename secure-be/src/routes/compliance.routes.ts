// backend/src/routes/compliance.routes.ts
import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { filterByOrganization } from '../middlewares/organization.middleware';
import { requirePermission } from '../middlewares/permission.middleware';
import { PERMISSIONS } from '../services/permission.service';
import {
    checkMiFIDCompliance,
    assessClientSuitability,
    categorizeClient,
    checkBestExecution,
    generateComplianceReport
} from '../services/compliance.service';
import { db } from '../index';
import logger from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /api/compliance/rules:
 *   get:
 *     summary: Get all compliance rules
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/rules', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user?.organizationId;

        const where: any = { isActive: true };
        
        // If user has organization, show global + org-specific rules
        // If super_admin, show all rules
        if (organizationId !== null && organizationId !== undefined) {
            where.OR = [
                { organizationId: null }, // Global rules
                { organizationId: organizationId } // Organization-specific rules
            ];
        }

        const rules = await db.complianceRule.findMany({
            where,
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(rules);
    } catch (error) {
        logger.error('Failed to fetch compliance rules', { error });
        res.status(500).json({ error: 'Failed to fetch compliance rules' });
    }
});

/**
 * @swagger
 * /api/compliance/rules:
 *   post:
 *     summary: Create a new compliance rule (super_admin only)
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 */
router.post('/rules', authenticateJWT, requirePermission(PERMISSIONS.MANAGE_ORGANIZATIONS), async (req, res) => {
    try {
        const { name, description, regulation, severity, requiredChecks, organizationId } = req.body;

        if (!name || !regulation) {
            return res.status(400).json({ error: 'Name and regulation are required' });
        }

        const rule = await db.complianceRule.create({
            data: {
                name,
                description,
                regulation,
                severity: severity || 'MEDIUM',
                requiredChecks: requiredChecks || [],
                organizationId: organizationId || null
            }
        });

        res.status(201).json(rule);
    } catch (error) {
        logger.error('Failed to create compliance rule', { error });
        res.status(500).json({ error: 'Failed to create compliance rule' });
    }
});

/**
 * @swagger
 * /api/compliance/checks/{callId}:
 *   get:
 *     summary: Get compliance checks for a call
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/checks/:callId', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const callId = Number.parseInt(req.params.callId);
        const user = (req as any).user;

        // Verify call belongs to user's organization
        const call = await db.call.findUnique({
            where: { id: callId },
            include: {
                organization: true
            }
        });

        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }

        const organizationId = user?.organizationId;
        if (organizationId !== null && organizationId !== undefined && call.organizationId !== organizationId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const checks = await db.complianceCheck.findMany({
            where: { callId },
            include: {
                rule: true
            },
            orderBy: { checkedAt: 'desc' }
        });

        res.json(checks);
    } catch (error) {
        logger.error('Failed to fetch compliance checks', { error });
        res.status(500).json({ error: 'Failed to fetch compliance checks' });
    }
});

/**
 * @swagger
 * /api/compliance/checks/{callId}:
 *   post:
 *     summary: Run compliance check on a call
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 */
router.post('/checks/:callId', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const callId = Number.parseInt(req.params.callId);
        const user = (req as any).user;

        const call = await db.call.findUnique({
            where: { id: callId },
            include: {
                analysis: true,
                organization: true
            }
        });

        if (!call || !call.analysis) {
            return res.status(404).json({ error: 'Call or analysis not found' });
        }

        const organizationId = user?.organizationId;
        if (organizationId !== null && organizationId !== undefined && call.organizationId !== organizationId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Check MiFID compliance
        const complianceResult = await checkMiFIDCompliance(call.analysis, call.organizationId || 0);

        // Get applicable compliance rules
        const rules = await db.complianceRule.findMany({
            where: {
                OR: [
                    { organizationId: null },
                    { organizationId: call.organizationId }
                ],
                regulation: { in: ['MiFID_II', 'MiFID_III'] },
                isActive: true
            }
        });

        // Create compliance checks for each rule
        const checks = await Promise.all(
            rules.map(async (rule) => {
                // Determine status based on compliance result
                let status = 'N/A';
                if (rule.name.includes('Suitability')) {
                    status = complianceResult.suitabilityAssessment ? 'PASS' : 'FAIL';
                } else if (rule.name.includes('Best Execution')) {
                    status = complianceResult.bestExecution ? 'PASS' : 'FAIL';
                } else if (rule.name.includes('Client Categorization')) {
                    status = complianceResult.clientCategorization ? 'PASS' : 'FAIL';
                }

                return db.complianceCheck.create({
                    data: {
                        callId,
                        ruleId: rule.id,
                        status,
                        details: JSON.parse(JSON.stringify(complianceResult)) as any,
                        checkedBy: user?.userId || null
                    }
                });
            })
        );

        // Update CallAnalysis with compliance data
        await db.callAnalysis.update({
            where: { callId },
            data: {
                mifidCompliance: JSON.parse(JSON.stringify(complianceResult)) as any,
                suitabilityScore: complianceResult.suitabilityAssessment ? 100 : null,
                bestExecutionCheck: complianceResult.bestExecution,
                clientCategory: call.analysis.clientCategory || null
            }
        });

        res.json({
            complianceResult,
            checks
        });
    } catch (error) {
        logger.error('Failed to run compliance check', { error });
        res.status(500).json({ error: 'Failed to run compliance check' });
    }
});

/**
 * @swagger
 * /api/compliance/suitability/{leadId}:
 *   get:
 *     summary: Get suitability assessment for a lead
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/suitability/:leadId', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const leadId = Number.parseInt(req.params.leadId);

        const assessments = await db.suitabilityAssessment.findMany({
            where: { leadId },
            orderBy: { assessmentDate: 'desc' }
        });

        res.json(assessments);
    } catch (error) {
        logger.error('Failed to fetch suitability assessments', { error });
        res.status(500).json({ error: 'Failed to fetch suitability assessments' });
    }
});

/**
 * @swagger
 * /api/compliance/suitability/{leadId}:
 *   post:
 *     summary: Create or update suitability assessment
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 */
router.post('/suitability/:leadId', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const leadId = Number.parseInt(req.params.leadId);
        const { callId, riskProfile, investmentObjectives, knowledgeExperience, financialSituation } = req.body;
        const user = (req as any).user;

        const result = await assessClientSuitability(
            leadId,
            callId || null,
            {
                riskProfile,
                investmentObjectives,
                knowledgeExperience,
                financialSituation
            },
            user?.userId
        );

        res.json(result);
    } catch (error) {
        logger.error('Failed to create suitability assessment', { error });
        res.status(500).json({ error: 'Failed to create suitability assessment' });
    }
});

/**
 * @swagger
 * /api/compliance/categorization/{leadId}:
 *   get:
 *     summary: Get client categorization
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/categorization/:leadId', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const leadId = Number.parseInt(req.params.leadId);

        const categorization = await db.clientCategorization.findUnique({
            where: { leadId }
        });

        if (!categorization) {
            return res.status(404).json({ error: 'Client categorization not found' });
        }

        res.json(categorization);
    } catch (error) {
        logger.error('Failed to fetch client categorization', { error });
        res.status(500).json({ error: 'Failed to fetch client categorization' });
    }
});

/**
 * @swagger
 * /api/compliance/categorization/{leadId}:
 *   post:
 *     summary: Update client categorization
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 */
router.post('/categorization/:leadId', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const leadId = Number.parseInt(req.params.leadId);
        const { category, assessmentDetails } = req.body;
        const user = (req as any).user;

        if (!category || !['RETAIL', 'PROFESSIONAL', 'ELIGIBLE_COUNTERPARTY'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category. Must be RETAIL, PROFESSIONAL, or ELIGIBLE_COUNTERPARTY' });
        }

        const result = await categorizeClient(
            leadId,
            category,
            assessmentDetails,
            user?.userId
        );

        res.json(result);
    } catch (error) {
        logger.error('Failed to categorize client', { error });
        res.status(500).json({ error: 'Failed to categorize client' });
    }
});

/**
 * @swagger
 * /api/compliance/best-execution/{callId}:
 *   post:
 *     summary: Check best execution compliance
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 */
router.post('/best-execution/:callId', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const callId = Number.parseInt(req.params.callId);

        const result = await checkBestExecution(callId);

        res.json({ bestExecutionVerified: result });
    } catch (error) {
        logger.error('Failed to check best execution', { error });
        res.status(500).json({ error: 'Failed to check best execution' });
    }
});

/**
 * @swagger
 * /api/compliance/reports:
 *   get:
 *     summary: Generate compliance report
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user?.organizationId;
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

        if (organizationId === null || organizationId === undefined) {
            return res.status(400).json({ error: 'Organization ID required' });
        }

        const report = await generateComplianceReport(organizationId, startDate, endDate);

        res.json(report);
    } catch (error) {
        logger.error('Failed to generate compliance report', { error });
        res.status(500).json({ error: 'Failed to generate compliance report' });
    }
});

export default router;

