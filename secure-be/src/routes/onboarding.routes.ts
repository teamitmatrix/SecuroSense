import { Router } from 'express';
import { setupOrganization } from '../services/onboarding.service';
import { authenticateJWT, generateToken, generateRefreshToken } from '../middlewares/auth.middleware';
import logger from '../utils/logger';

const router = Router();

router.use(authenticateJWT);

/**
 * @swagger
 * /api/onboarding/setup:
 *   post:
 *     summary: Setup Organization and Onboard User
 *     tags: [Onboarding]
 */
router.post('/setup', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { organizationName, industry, size, teams, email, phone, website, country, city, state, address, postalCode, description } = req.body;

        if (!organizationName || !industry) {
            return res.status(400).json({ error: 'Organization Name and Industry are required' });
        }

        const org = await setupOrganization({
            userId,
            organizationName,
            industry,
            size,
            email,
            phone,
            website,
            country,
            city,
            state,
            address,
            postalCode,
            description,
            teams
        });

        // Generate NEW tokens with organizationId
        // Assuming the user's role hasn't changed, we reuse the role from the token or fetch?
        // Let's rely on the token's role for now, or default to current.
        const role = (req as any).user.role;

        const accessToken = generateToken(userId, role, org.id);
        const refreshToken = generateRefreshToken(userId, role, org.id);

        logger.info(`Organization setup completed for user ${userId}: ${organizationName}`);

        res.json({
            message: 'Setup complete',
            organization: org,
            tokens: {
                accessToken,
                refreshToken
            }
        });

    } catch (error: any) {
        logger.error('Onboarding failed', { error });
        res.status(500).json({ error: 'Failed to complete onboarding' });
    }
});

export default router;
