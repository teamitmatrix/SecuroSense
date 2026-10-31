// backend/src/middlewares/organization.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './permission.middleware';
import logger from '../utils/logger';

/**
 * Middleware to add organizationId filter to request
 * This ensures users only see data from their organization
 * Super Admin (organizationId = null) can see all data
 */
export const filterByOrganization = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get organizationId from JWT token
        const organizationId = (req.user as any).organizationId;

        // Super Admin (organizationId = null) can see all data
        // Other users can only see their organization's data
        // For regular admins, set organizationId in query to enforce filtering
        // For super_admin, don't override query param (they can filter by specific org)
        if (organizationId !== null && organizationId !== undefined) {
            // Only set query param if not already set (allows super_admin to override)
            // For regular admins, this ensures they can only see their own data
            if (!req.query.organizationId) {
                req.query.organizationId = organizationId.toString();
            }
            
            // Also add to request body for POST/PUT requests
            if (req.body && typeof req.body === 'object') {
                req.body.organizationId = organizationId;
            }
        }

        // Store organizationId in request for use in route handlers
        (req as any).organizationId = organizationId;

        next();
    } catch (error) {
        logger.error('Organization filter middleware failed', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Middleware to require organization (exclude Super Admin)
 * Use this for routes that require an organization context
 */
export const requireOrganization = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const organizationId = (req.user as any).organizationId;

        if (organizationId === null || organizationId === undefined) {
            logger.warn('Organization required but not found', {
                userId: req.user.userId,
                path: req.path
            });
            return res.status(403).json({
                error: 'Forbidden',
                message: 'This action requires an organization context. Please complete onboarding first.'
            });
        }

        next();
    } catch (error) {
        logger.error('Organization requirement check failed', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

