// backend/src/services/data-retention.service.ts
import { db } from '../index';
import logger from '../utils/logger';

/**
 * Apply data retention policy for an organization
 */
export const applyRetentionPolicy = async (organizationId: number): Promise<{
    archived: number;
    deleted: number;
    errors: number;
}> => {
    try {
        const policies = await db.dataRetentionPolicy.findMany({
            where: {
                organizationId,
                autoDeleteEnabled: true
            }
        });

        let archived = 0;
        let deleted = 0;
        let errors = 0;

        for (const policy of policies) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

            try {
                switch (policy.dataType) {
                    case 'CALLS':
                        // Archive old calls (mark as archived, don't delete yet)
                        const oldCalls = await db.call.findMany({
                            where: {
                                organizationId,
                                createdAt: { lt: cutoffDate }
                            },
                            select: { id: true }
                        });

                        // For now, we'll just log. In production, you might want to:
                        // 1. Move to archive table
                        // 2. Delete recordings from storage
                        // 3. Delete transcripts
                        archived += oldCalls.length;
                        logger.info('Calls eligible for archiving', { 
                            organizationId, 
                            count: oldCalls.length,
                            cutoffDate 
                        });
                        break;

                    case 'TRANSCRIPTS':
                        // Mark transcripts for deletion (set to null)
                        const transcriptResult = await db.call.updateMany({
                            where: {
                                organizationId,
                                transcript: { not: null },
                                createdAt: { lt: cutoffDate }
                            },
                            data: {
                                transcript: null
                            }
                        });
                        deleted += transcriptResult.count;
                        break;

                    case 'AUDIT_LOGS':
                        // Delete old audit logs
                        const auditResult = await db.auditLog.deleteMany({
                            where: {
                                user: {
                                    organizationId
                                },
                                timestamp: { lt: cutoffDate }
                            }
                        });
                        deleted += auditResult.count;
                        break;

                    default:
                        logger.warn('Unknown data type for retention policy', { dataType: policy.dataType });
                }

                // Update last cleanup date
                await db.dataRetentionPolicy.update({
                    where: { id: policy.id },
                    data: { lastCleanupDate: new Date() }
                });
            } catch (error) {
                errors++;
                logger.error('Failed to apply retention policy', { 
                    error, 
                    policyId: policy.id,
                    dataType: policy.dataType 
                });
            }
        }

        logger.info('Data retention policy applied', {
            organizationId,
            archived,
            deleted,
            errors
        });

        return { archived, deleted, errors };
    } catch (error) {
        logger.error('Failed to apply retention policy', { error, organizationId });
        throw error;
    }
};

/**
 * Get retention status for an organization
 */
export const getRetentionStatus = async (organizationId: number) => {
    try {
        const policies = await db.dataRetentionPolicy.findMany({
            where: { organizationId }
        });

        const status = {
            policies: policies.map(p => ({
                dataType: p.dataType,
                retentionPeriodDays: p.retentionPeriodDays,
                autoDeleteEnabled: p.autoDeleteEnabled,
                lastCleanupDate: p.lastCleanupDate
            })),
            totalPolicies: policies.length,
            activePolicies: policies.filter(p => p.autoDeleteEnabled).length
        };

        return status;
    } catch (error) {
        logger.error('Failed to get retention status', { error, organizationId });
        throw error;
    }
};

