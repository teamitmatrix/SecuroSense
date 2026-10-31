// backend/src/scripts/clear-all-data.ts
import { db } from '../index';
import logger from '../utils/logger';

async function clearAllData() {
    try {
        logger.info('🗑️  Starting data cleanup...');

        // Delete in order to respect foreign key constraints
        logger.info('Deleting Compliance Checks...');
        await db.complianceCheck.deleteMany({});

        logger.info('Deleting Compliance Rules...');
        await db.complianceRule.deleteMany({});

        logger.info('Deleting Data Retention Policies...');
        await db.dataRetentionPolicy.deleteMany({});

        logger.info('Deleting Transaction Records...');
        await db.transactionRecord.deleteMany({});

        logger.info('Deleting Suitability Assessments...');
        await db.suitabilityAssessment.deleteMany({});

        logger.info('Deleting Client Categorizations...');
        await db.clientCategorization.deleteMany({});

        logger.info('Deleting Call Analyses...');
        await db.callAnalysis.deleteMany({});

        logger.info('Deleting Calls...');
        await db.call.deleteMany({});

        logger.info('Deleting Leads...');
        await db.lead.deleteMany({});

        logger.info('Deleting Promises...');
        await db.promise.deleteMany({});

        logger.info('Deleting QA Parameters...');
        await db.globalQAParameter.deleteMany({});

        logger.info('Deleting QA Templates...');
        await db.qATemplate.deleteMany({});

        logger.info('Deleting Teams...');
        await db.team.deleteMany({});

        logger.info('Deleting Audit Logs...');
        await db.auditLog.deleteMany({});

        logger.info('Deleting Refresh Tokens...');
        await db.refreshToken.deleteMany({});

        logger.info('Deleting User Permissions...');
        await db.userPermission.deleteMany({});

        logger.info('Deleting Role Permissions...');
        await db.rolePermission.deleteMany({});

        logger.info('Deleting All Roles...');
        await db.role.deleteMany({});

        logger.info('Deleting All Users...');
        await db.user.deleteMany({});

        logger.info('Deleting All Organizations...');
        await db.organization.deleteMany({});

        logger.info('Deleting Permissions...');
        await db.permission.deleteMany({});

        logger.info('✅ All data cleared successfully!');
        logger.info('📝 Note: Permissions and system roles are preserved.');
        logger.info('🌱 Run seed script to restore default data.');

    } catch (error) {
        logger.error('❌ Error clearing data:', error);
        throw error;
    } finally {
        await db.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    clearAllData()
        .then(() => {
            logger.info('✅ Cleanup complete!');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('❌ Cleanup failed:', error);
            process.exit(1);
        });
}

export default clearAllData;

