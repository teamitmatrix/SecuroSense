import { Router } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
import { verifyRefreshToken, generateToken, authenticateJWT } from '../middlewares/auth.middleware';
import { db } from '../index';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, nameAr, language } = req.body;
        logger.info('Registration attempt', { email });
        const result = await registerUser(email, password, name, nameAr, language);
        logger.info('User registered successfully', { email, userId: result.user.id });
        res.json(result);
    } catch (error: any) {
        logger.error('Registration failed', { error: error.message, email: req.body.email });
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        logger.info('Login attempt', { email });
        const result = await loginUser(email, password);
        logger.info('User logged in successfully', { email, userId: result.user.id });
        res.json(result);
    } catch (error: any) {
        logger.error('Login failed', { error: error.message, email: req.body.email });
        res.status(401).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 */
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const accessToken = generateToken(payload.userId, payload.role);
    res.json({ accessToken });
});

/**
 * @swagger
 * /api/auth/user/language:
 *   put:
 *     summary: Update user language preference
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [en, ar, fr]
 *                 example: en
 *     responses:
 *       200:
 *         description: Language updated successfully
 *       400:
 *         description: Invalid language code
 */
router.put('/user/language', authenticateJWT, async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { language } = req.body;
        
        const validLanguages = ['en', 'ar', 'fr'];
        if (!language || !validLanguages.includes(language)) {
            return res.status(400).json({ error: 'Invalid language. Must be one of: en, ar, fr' });
        }
        
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: { language },
            select: {
                id: true,
                email: true,
                name: true,
                language: true,
                role: true,
                organizationId: true
            }
        });
        
        logger.info('User language preference updated', { userId, language });
        res.json({ message: 'Language updated successfully', user: updatedUser });
    } catch (error: any) {
        logger.error('Failed to update language preference', { error: error.message });
        res.status(500).json({ error: 'Failed to update language preference' });
    }
});

export default router;
