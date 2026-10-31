// backend/src/services/compliance.service.ts
import { db } from '../index';
import logger from '../utils/logger';
import { CallAnalysis } from '@prisma/client';

export interface MiFIDComplianceResult {
    suitabilityAssessment: boolean;
    bestExecution: boolean;
    clientCategorization: boolean;
    recordKeeping: boolean;
    transactionReporting: boolean;
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
    violations: string[];
    score: number; // 0-100
}

export interface SuitabilityResult {
    riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | null;
    investmentObjectives: string[];
    knowledgeExperience: string[];
    financialSituation: string[];
    isSuitable: boolean;
    score: number; // 0-100
}

export type ClientCategory = 'RETAIL' | 'PROFESSIONAL' | 'ELIGIBLE_COUNTERPARTY';

/**
 * Check MiFID compliance for a call analysis
 */
export const checkMiFIDCompliance = async (
    callAnalysis: CallAnalysis,
    organizationId: number
): Promise<MiFIDComplianceResult> => {
    try {
        // Get organization's compliance rules
        const org = await db.organization.findUnique({
            where: { id: organizationId },
            include: {
                complianceRules: {
                    where: {
                        regulation: { in: ['MiFID_II', 'MiFID_III'] },
                        isActive: true
                    }
                }
            }
        });

        if (!org || !org.mifidEnabled) {
            return {
                suitabilityAssessment: false,
                bestExecution: false,
                clientCategorization: false,
                recordKeeping: true, // Always true if we have the record
                transactionReporting: false,
                overallStatus: 'NON_COMPLIANT',
                violations: ['MiFID compliance not enabled for organization'],
                score: 0
            };
        }

        const violations: string[] = [];
        let score = 100;

        // Check suitability assessment
        const suitabilityCheck = callAnalysis.suitabilityScore !== null && callAnalysis.suitabilityScore !== undefined;
        if (!suitabilityCheck) {
            violations.push('Suitability assessment not performed');
            score -= 25;
        }

        // Check best execution
        const bestExecutionCheck = callAnalysis.bestExecutionCheck === true;
        if (!bestExecutionCheck) {
            violations.push('Best execution not verified');
            score -= 20;
        }

        // Check client categorization
        const clientCategorizationCheck = callAnalysis.clientCategory !== null && callAnalysis.clientCategory !== undefined;
        if (!clientCategorizationCheck) {
            violations.push('Client categorization not performed');
            score -= 20;
        }

        // Check record keeping (always true if we have the analysis)
        const recordKeepingCheck = true;

        // Check transaction reporting (if deal was closed)
        let transactionReportingCheck = true;
        if (callAnalysis.wasDealClosed) {
            // Check if transaction record exists
            const transactionRecord = await db.transactionRecord.findUnique({
                where: { callId: callAnalysis.callId }
            });
            if (!transactionRecord) {
                violations.push('Transaction record not created for closed deal');
                score -= 15;
                transactionReportingCheck = false;
            }
        }

        const overallStatus = violations.length === 0 
            ? 'COMPLIANT' 
            : violations.length <= 2 
                ? 'PARTIAL' 
                : 'NON_COMPLIANT';

        return {
            suitabilityAssessment: suitabilityCheck,
            bestExecution: bestExecutionCheck,
            clientCategorization: clientCategorizationCheck,
            recordKeeping: recordKeepingCheck,
            transactionReporting: transactionReportingCheck,
            overallStatus,
            violations,
            score: Math.max(0, score)
        };
    } catch (error) {
        logger.error('Failed to check MiFID compliance', { error, callAnalysisId: callAnalysis.id });
        throw error;
    }
};

/**
 * Assess client suitability for investment recommendations
 */
export const assessClientSuitability = async (
    leadId: number,
    callId: number,
    assessmentData: {
        riskProfile?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
        investmentObjectives?: string[];
        knowledgeExperience?: string[];
        financialSituation?: string[];
    },
    assessedBy?: number
): Promise<SuitabilityResult> => {
    try {
        // Calculate suitability score
        let score = 0;
        const factors: string[] = [];

        if (assessmentData.riskProfile) {
            score += 25;
            factors.push(`Risk Profile: ${assessmentData.riskProfile}`);
        }

        if (assessmentData.investmentObjectives && assessmentData.investmentObjectives.length > 0) {
            score += 25;
            factors.push(`Investment Objectives: ${assessmentData.investmentObjectives.join(', ')}`);
        }

        if (assessmentData.knowledgeExperience && assessmentData.knowledgeExperience.length > 0) {
            score += 25;
            factors.push(`Knowledge & Experience: ${assessmentData.knowledgeExperience.join(', ')}`);
        }

        if (assessmentData.financialSituation && assessmentData.financialSituation.length > 0) {
            score += 25;
            factors.push(`Financial Situation: ${assessmentData.financialSituation.join(', ')}`);
        }

        const isSuitable = score >= 75; // At least 3 out of 4 factors assessed

        // Save suitability assessment
        const assessment = await db.suitabilityAssessment.create({
            data: {
                leadId,
                callId,
                riskProfile: assessmentData.riskProfile || null,
                investmentObjectives: assessmentData.investmentObjectives ? JSON.parse(JSON.stringify(assessmentData.investmentObjectives)) as any : null,
                knowledgeExperience: assessmentData.knowledgeExperience ? JSON.parse(JSON.stringify(assessmentData.knowledgeExperience)) as any : null,
                financialSituation: assessmentData.financialSituation ? JSON.parse(JSON.stringify(assessmentData.financialSituation)) as any : null,
                assessmentResult: {
                    score,
                    isSuitable,
                    factors
                } as any,
                assessedBy: assessedBy || null
            }
        });

        // Update CallAnalysis with suitability score
        await db.callAnalysis.update({
            where: { callId },
            data: {
                suitabilityScore: score
            }
        });

        logger.info('Suitability assessment created', { assessmentId: assessment.id, leadId, score });

        return {
            riskProfile: assessmentData.riskProfile || null,
            investmentObjectives: assessmentData.investmentObjectives || [],
            knowledgeExperience: assessmentData.knowledgeExperience || [],
            financialSituation: assessmentData.financialSituation || [],
            isSuitable,
            score
        };
    } catch (error) {
        logger.error('Failed to assess client suitability', { error, leadId, callId });
        throw error;
    }
};

/**
 * Categorize client according to MiFID requirements
 */
export const categorizeClient = async (
    leadId: number,
    category: ClientCategory,
    assessmentDetails: any,
    assessedBy?: number
): Promise<any> => {
    try {
        // Check if categorization already exists
        const existing = await db.clientCategorization.findUnique({
            where: { leadId }
        });

        const categorizationData = {
            leadId,
            category,
            assessmentDetails: assessmentDetails || null,
            assessedBy: assessedBy || null
        };

        let categorization;
        if (existing) {
            // Update existing categorization
            categorization = await db.clientCategorization.update({
                where: { leadId },
                data: categorizationData
            });
        } else {
            // Create new categorization
            categorization = await db.clientCategorization.create({
                data: categorizationData
            });
        }

        // Update CallAnalysis with client category
        const lead = await db.lead.findUnique({
            where: { id: leadId },
            include: {
                calls: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                    include: { analysis: true }
                }
            }
        });

        if (lead && lead.calls.length > 0 && lead.calls[0].analysis) {
            await db.callAnalysis.update({
                where: { callId: lead.calls[0].id },
                data: {
                    clientCategory: category
                }
            });
        }

        logger.info('Client categorized', { categorizationId: categorization.id, leadId, category });

        return categorization;
    } catch (error) {
        logger.error('Failed to categorize client', { error, leadId, category });
        throw error;
    }
};

/**
 * Check best execution compliance
 */
export const checkBestExecution = async (callId: number): Promise<boolean> => {
    try {
        const call = await db.call.findUnique({
            where: { id: callId },
            include: { analysis: true }
        });

        if (!call || !call.analysis) {
            return false;
        }

        // Check if best execution was mentioned in transcript or analysis
        const transcript = call.transcript?.toLowerCase() || '';
        const summary = call.analysis.summary?.toLowerCase() || '';
        
        const bestExecutionKeywords = [
            'best execution',
            'execution policy',
            'execution venue',
            'best price',
            'execution quality'
        ];

        const hasBestExecutionMention = bestExecutionKeywords.some(keyword => 
            transcript.includes(keyword) || summary.includes(keyword)
        );

        // Update CallAnalysis
        await db.callAnalysis.update({
            where: { callId },
            data: {
                bestExecutionCheck: hasBestExecutionMention
            }
        });

        return hasBestExecutionMention;
    } catch (error) {
        logger.error('Failed to check best execution', { error, callId });
        return false;
    }
};

/**
 * Generate compliance report for an organization
 */
export const generateComplianceReport = async (
    organizationId: number,
    startDate: Date,
    endDate: Date
): Promise<any> => {
    try {
        const calls = await db.call.findMany({
            where: {
                organizationId,
                timestamp: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                analysis: true,
                complianceChecks: {
                    include: {
                        rule: true
                    }
                }
            }
        });

        const totalCalls = calls.length;
        const compliantCalls = calls.filter(call => {
            if (!call.analysis) return false;
            return call.analysis.suitabilityScore !== null &&
                   call.analysis.bestExecutionCheck === true &&
                   call.analysis.clientCategory !== null;
        }).length;

        const complianceRate = totalCalls > 0 ? (compliantCalls / totalCalls) * 100 : 0;

        // =========================================================
        // Dashboard Insights (SecuroSense 2.0 - safe fallbacks)
        // =========================================================
        const avgQaScore = (() => {
            const scores = calls
                .map((c) => c.analysis?.score)
                .filter((s): s is number => typeof s === 'number' && Number.isFinite(s));
            if (scores.length === 0) return null;
            const sum = scores.reduce((acc, s) => acc + s, 0);
            return Math.round((sum / scores.length) * 10) / 10; // 1 decimal
        })();

        const disclosureStats = (() => {
            let compliant = 0;
            let missing = 0;
            let unknown = 0;

            for (const call of calls) {
                const v = (call.analysis as any)?.mifidCompliance?.regulatoryDisclosures;
                if (v === true) compliant++;
                else if (v === false) missing++;
                else unknown++;
            }

            let statusLabel: 'Complete' | 'Partial' | 'Missing' | 'Unknown' = 'Unknown';
            if (compliant > 0 || missing > 0) {
                if (missing === 0) statusLabel = 'Complete';
                else if (compliant === 0) statusLabel = 'Missing';
                else statusLabel = 'Partial';
            }

            return { compliant, missing, unknown, statusLabel };
        })();

        const overallPosture: 'COMPLIANT' | 'RISKY' | 'HIGH_RISK' = (() => {
            if (complianceRate >= 80) return 'COMPLIANT';
            if (complianceRate >= 50) return 'RISKY';
            return 'HIGH_RISK';
        })();

        const violationKeywordsCount = calls.reduce((acc, call) => {
            const v = (call.analysis as any)?.mifidCompliance?.violations;
            return acc + (Array.isArray(v) ? v.length : 0);
        }, 0);

        const escalationRequired = calls.some((call) => {
            const status = (call.analysis as any)?.mifidCompliance?.overallStatus;
            return status === 'NON_COMPLIANT';
        });

        // Group by compliance rule
        const ruleStats: Record<string, any> = {};
        calls.forEach(call => {
            call.complianceChecks.forEach(check => {
                const ruleName = check.rule.name;
                if (!ruleStats[ruleName]) {
                    ruleStats[ruleName] = {
                        total: 0,
                        pass: 0,
                        fail: 0,
                        na: 0
                    };
                }
                ruleStats[ruleName].total++;
                if (check.status === 'PASS') ruleStats[ruleName].pass++;
                else if (check.status === 'FAIL') ruleStats[ruleName].fail++;
                else ruleStats[ruleName].na++;
            });
        });

        return {
            organizationId,
            period: {
                startDate,
                endDate
            },
            summary: {
                totalCalls,
                compliantCalls,
                complianceRate: Number(complianceRate.toFixed(2))
            },
            insights: {
                complianceSummary: {
                    posture: overallPosture,
                    scriptAdherencePercent: avgQaScore,
                    riskDisclosures: disclosureStats,
                    misSelling: null,
                    harassment: null,
                },
                fraudRisk: {
                    probabilityPercent: 5,
                    riskyToneScorePercent: null,
                    topPhrase: null,
                },
                regulatoryCheck: {
                    escalationRequired,
                    missingDisclosuresCount: disclosureStats.missing,
                    violationKeywordsCount,
                }
            },
            ruleStatistics: ruleStats,
            generatedAt: new Date()
        };
    } catch (error) {
        logger.error('Failed to generate compliance report', { error, organizationId });
        throw error;
    }
};

