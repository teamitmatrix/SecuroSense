import { Request, Response, NextFunction } from 'express';
import { hasPermission, hasAnyPermission, PermissionName } from '../services/permission.service';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        role: string;
        organizationId?: number | null;
    };
    organizationId?: number | null;
}

/**
 * Middleware to check if user has required permission
 * Usage: router.get('/endpoint', requirePermission('VIEW_CALLS'), handler)
 */
export const requirePermission = (permission: PermissionName) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const hasAccess = await hasPermission(req.user.userId, permission);

            if (!hasAccess) {
                logger.warn('Permission denied', {
                    userId: req.user.userId,
                    permission,
                    path: req.path
                });
                return res.status(403).json({
                    error: 'Forbidden',
                    message: `You do not have permission: ${permission}`
                });
            }

            next();
        } catch (error) {
            logger.error('Permission check failed', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

/**
 * Middleware to check if user has ANY of the required permissions
 */
export const requireAnyPermission = (permissions: PermissionName[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const hasAccess = await hasAnyPermission(req.user.userId, permissions);

            if (!hasAccess) {
                logger.warn('Permission denied', {
                    userId: req.user.userId,
                    permissions,
                    path: req.path
                });
                return res.status(403).json({
                    error: 'Forbidden',
                    message: `You need one of these permissions: ${permissions.join(', ')}`
                });
            }

            next();
        } catch (error) {
            logger.error('Permission check failed', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role?.toUpperCase() !== 'ADMIN') {
        logger.warn('Admin access denied', {
            userId: req.user.userId,
            role: req.user.role,
            path: req.path
        });
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }

    next();
};
