// backend/src/scripts/seed-compliance-rules.ts
import { db } from '../index';
import logger from '../utils/logger';

/**
 * Seed default MiFID compliance rules
 */
export const seedComplianceRules = async () => {
    try {
        logger.info('Seeding default MiFID compliance rules...');

        const defaultRules = [
            {
                name: 'MiFID II - Suitability Assessment',
                description: 'Verify that a suitability assessment was performed for investment recommendations',
                regulation: 'MiFID_II',
                severity: 'CRITICAL',
                requiredChecks: [
                    'Risk profile assessment',
                    'Investment objectives identification',
                    'Knowledge and experience evaluation',
                    'Financial situation review'
                ],
                organizationId: null // Global rule
            },
            {
                name: 'MiFID II - Best Execution',
                description: 'Verify that best execution policy was disclosed and followed',
                regulation: 'MiFID_II',
                severity: 'HIGH',
                requiredChecks: [
                    'Best execution policy disclosure',
                    'Execution venue selection',
                    'Price improvement verification'
                ],
                organizationId: null
            },
            {
                name: 'MiFID II - Client Categorization',
                description: 'Verify that client was properly categorized (Retail, Professional, or Eligible Counterparty)',
                regulation: 'MiFID_II',
                severity: 'CRITICAL',
                requiredChecks: [
                    'Client categorization performed',
                    'Categorization documented',
                    'Appropriate protections applied'
                ],
                organizationId: null
            },
            {
                name: 'MiFID II - Record Keeping',
                description: 'Ensure all required records are maintained for regulatory purposes',
                regulation: 'MiFID_II',
                severity: 'HIGH',
                requiredChecks: [
                    'Call recording stored',
                    'Transcript maintained',
                    'Analysis results saved',
                    'Compliance checks logged'
                ],
                organizationId: null
            },
            {
                name: 'MiFID II - Transaction Reporting',
                description: 'Verify that transactions are properly reported to regulatory authorities',
                regulation: 'MiFID_II',
                severity: 'HIGH',
                requiredChecks: [
                    'Transaction record created',
                    'Reporting status tracked',
                    'Regulatory submission verified'
                ],
                organizationId: null
            },
            {
                name: 'MiFID III - Enhanced Suitability',
                description: 'Enhanced suitability requirements under MiFID III',
                regulation: 'MiFID_III',
                severity: 'CRITICAL',
                requiredChecks: [
                    'Enhanced risk assessment',
                    'Product governance compliance',
                    'Target market identification'
                ],
                organizationId: null
            }
        ];

        for (const rule of defaultRules) {
            try {
                // Check if rule already exists (using any to bypass type check until Prisma client is regenerated)
                const existing = await (db as any).complianceRule?.findFirst({
                    where: {
                        name: rule.name,
                        organizationId: rule.organizationId
                    }
                });

                if (!existing) {
                    await (db as any).complianceRule?.create({
                        data: rule
                    });
                    logger.info(`Created compliance rule: ${rule.name}`);
                } else {
                    logger.info(`Compliance rule already exists: ${rule.name}`);
                }
            } catch (error: any) {
                // If table doesn't exist yet (migration not run), skip
                if (error.code === 'P2021' || error.message?.includes('does not exist')) {
                    logger.warn(`ComplianceRule table not found. Please run migration first: ${rule.name}`);
                    break;
                }
                throw error;
            }
        }

        logger.info('✅ Default MiFID compliance rules seeded successfully');
    } catch (error) {
        logger.error('Failed to seed compliance rules', { error });
        throw error;
    }
};

// Run if called directly
if (require.main === module) {
    seedComplianceRules()
        .then(() => {
            logger.info('Compliance rules seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Compliance rules seeding failed', { error });
            process.exit(1);
        });
}

