import { db } from '../index';
import logger from '../utils/logger';

export interface AuditLogInput {
    userId: number;
    action: string;
    resource?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log user action for audit trail and compliance
 */
export const logAuditEvent = async (input: AuditLogInput): Promise<void> => {
    try {
        await db.auditLog.create({
            data: {
                userId: input.userId,
                action: input.action,
                resource: input.resource || null,
                details: input.details || null,
                ipAddress: input.ipAddress || null,
                userAgent: input.userAgent || null
            }
        });
        logger.info('Audit event logged', { action: input.action, userId: input.userId });
    } catch (error) {
        // Never fail the main operation due to audit logging failure
        logger.error('Failed to log audit event', { error, input });
    }
};

/**
 * Get audit logs for a user with pagination
 */
export const getUserAuditLogs = async (
    userId: number,
    page: number = 1,
    limit: number = 50
) => {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        db.auditLog.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            }
        }),
        db.auditLog.count({ where: { userId } })
    ]);

    return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get audit logs for a specific resource
 */
export const getResourceAuditLogs = async (
    resource: string,
    page: number = 1,
    limit: number = 50
) => {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        db.auditLog.findMany({
            where: { resource },
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            }
        }),
        db.auditLog.count({ where: { resource } })
    ]);

    return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get all audit logs with filters (admin only)
 */
export const getAllAuditLogs = async (filters: {
    userId?: number;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}) => {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = { contains: filters.resource };
    if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
        db.auditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true
                    }
                }
            }
        }),
        db.auditLog.count({ where })
    ]);

    return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};
