import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// ============================================
// JWT Secret Validation (P0 Security)
// Fail-fast if secrets are not configured
// ============================================
const SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!SECRET || SECRET === 'secret') {
    console.error('FATAL: JWT_SECRET must be set to a secure value in environment variables');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

if (!REFRESH_SECRET || REFRESH_SECRET === 'refresh_secret') {
    console.error('FATAL: JWT_REFRESH_SECRET must be set to a secure value in environment variables');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

// Use defaults only in development
const JWT_SECRET = SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = REFRESH_SECRET || 'dev-refresh-secret-change-in-production';

export const generateToken = (userId: number, role: string, organizationId?: number | null) => {
    return jwt.sign({ userId, role, organizationId }, JWT_SECRET, { expiresIn: '1h' });
};

export const generateRefreshToken = (userId: number, role: string, organizationId?: number | null) => {
    return jwt.sign({ userId, role, organizationId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyRefreshToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (err) {
        return null;
    }
};

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // Support token via query param for file downloads opened in a new tab.
    // NOTE: Prefer Authorization header in API calls; query tokens can leak via logs/history.
    const queryTokenRaw = (req.query?.token ?? req.query?.access_token) as string | string[] | undefined;
    const queryToken = Array.isArray(queryTokenRaw) ? queryTokenRaw[0] : queryTokenRaw;

    const token =
        (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined) ||
        queryToken;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            // If token is expired or invalid, send 401 so frontend knows to refresh
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
        }

        (req as any).user = user;
        next();
    });
};
