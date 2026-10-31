import { db } from '../index';
import { analyzeTranscriptWithAI } from './ai.service';
import { getOrganizationQATemplate } from './qa-template.service';
import { encryptField } from '../utils/encryption';
import logger from '../utils/logger';
import type { Prisma } from '@prisma/client';

type CallWithAnalysis = Prisma.CallGetPayload<{
    include: { analysis: true }
}>;

export type AnalyzeCallInput = {
    transcript: string;
    customerName: string;
    customerNameAr?: string;
    duration: number;
    agentName?: string;
    agentNameAr?: string;
    recordingUrl?: string;
    leadId?: number;
    customerPhone?: string;
    organizationId?: number;
    // MiFID II Article 16(7) - Recording Consent
    consentObtained?: boolean;
    consentMethod?: string;
};

export const analyzeCall = async (input: AnalyzeCallInput): Promise<CallWithAnalysis> => {
    // 1. Get Organization's QA Template (if organizationId provided)
    let qaParameters = undefined;
    if (input.organizationId) {
        const orgTemplate = await getOrganizationQATemplate(input.organizationId);
        if (orgTemplate?.parameters) {
            // Convert template parameters to AI service format
            qaParameters = (orgTemplate.parameters as any[]).map((param: any) => ({
                name: param.name || param.description,
                description: param.description,
                passCriteria: param.passCriteria || param.description
            }));
        }
    }

    // 2. Perform AI Analysis with QA Parameters
    const aiResult = await analyzeTranscriptWithAI(input.transcript, qaParameters);

    // 3. Resolve Lead (with encrypted phone number)
    // Phone number should already be encrypted from the route, but ensure it here too
    const encryptedPhone = input.customerPhone && !input.customerPhone.includes(':') 
        ? encryptField(input.customerPhone) 
        : input.customerPhone;
    
    let targetLeadId = input.leadId;
    if (targetLeadId && input.customerNameAr) {
        // If uploading to an existing lead, persist Arabic name if missing.
        try {
            const existing = await db.lead.findUnique({
                where: { id: targetLeadId },
                select: { customerNameAr: true }
            });
            if (existing && !existing.customerNameAr) {
                await db.lead.update({
                    where: { id: targetLeadId },
                    data: { customerNameAr: input.customerNameAr }
                });
            }
        } catch {
            // Non-blocking: don't fail call analysis due to name enrichment.
        }
    }
    if (!targetLeadId) {
        // Try to find if a lead already exists for this customer name
        // Note: We search by name only since phone is encrypted and won't match easily
        const existingLead = await db.lead.findFirst({
            where: { customerName: input.customerName },
            orderBy: { createdAt: 'desc' }
        });

        if (existingLead) {
            targetLeadId = existingLead.id;
            // Update phone if it's missing on the lead but provided now
            if ((encryptedPhone && !existingLead.customerPhone) || (input.customerNameAr && !(existingLead as any).customerNameAr)) {
                const leadUpdate: any = {};
                if (encryptedPhone && !existingLead.customerPhone) {
                    leadUpdate.customerPhone = encryptedPhone;
                }
                if (input.customerNameAr && !(existingLead as any).customerNameAr) {
                    leadUpdate.customerNameAr = input.customerNameAr;
                }
                await db.lead.update({
                    where: { id: existingLead.id },
                    data: leadUpdate
                });
            }
        } else {
            const newLead = await db.lead.create({
                data: {
                    customerName: input.customerName,
                    customerNameAr: input.customerNameAr || null,
                    customerPhone: encryptedPhone
                }
            });
            targetLeadId = newLead.id;
        }
    }

    // 4. Save to Database with consent tracking (MiFID II Article 16(7))
    const finalAgentName = (input.agentName && input.agentName !== 'Unknown Agent') ? input.agentName : (aiResult.agentName || 'Unknown Agent');
    const consentObtained = input.consentObtained === true;
    const consentMethod = input.consentMethod || 'electronic';

    const call = await db.call.create({
        data: {
            leadId: targetLeadId,
            agentName: finalAgentName,
            agentNameAr: input.agentNameAr || null,
            customerName: input.customerName,
            customerNameAr: input.customerNameAr || null,
            customerPhone: encryptedPhone, // Encrypted phone number
            transcript: input.transcript,
            duration: input.duration,
            recordingUrl: input.recordingUrl,
            language: aiResult.detectedLanguage || null,
            organizationId: input.organizationId || null,
            // Recording Consent (MiFID II Article 16(7))
            consentObtained: consentObtained,
            consentTimestamp: consentObtained ? new Date() : null,
            consentMethod: consentObtained ? consentMethod : null,
            analysis: {
                create: {
                    sentiment: aiResult.sentiment,
                    keywords: { set: aiResult.keywords },
                    topics: { set: aiResult.topics },
                    actionItems: { set: aiResult.actionItems },
                    summary: aiResult.summary,
                    score: aiResult.score,
                    callType: aiResult.callType,
                    wasDealClosed: aiResult.wasDealClosed,
                    agentDetails: aiResult.agentDetails as any,
                    coachingTips: aiResult.coachingTips,
                    objections: aiResult.objections as any,
                    qaResults: aiResult.qaResults as any
                }
            }
        },
        include: {
            analysis: true
        }
    });

    // Automatically update lead status if deal was closed
    if (call.leadId && aiResult.wasDealClosed) {
        await db.lead.update({
            where: { id: call.leadId },
            data: { status: 'CLOSED' }
        });
    }

    // 5. Update CallAnalysis with MiFID compliance data if available
    if (aiResult.mifidCompliance || aiResult.suitabilityAssessment) {
        const updateData: any = {};
        
        if (aiResult.mifidCompliance) {
            updateData.mifidCompliance = aiResult.mifidCompliance;
            updateData.bestExecutionCheck = aiResult.mifidCompliance.bestExecution || false;
            updateData.clientCategory = aiResult.mifidCompliance.clientCategorization || null;
        }
        
        if (aiResult.suitabilityAssessment) {
            const hasRiskProfile = aiResult.suitabilityAssessment.riskProfile !== null && 
                                   aiResult.suitabilityAssessment.riskProfile !== undefined;
            updateData.suitabilityScore = hasRiskProfile ? 100 : null;
        }
        
        await db.callAnalysis.update({
            where: { callId: call.id },
            data: updateData
        });
    }

    // 6. Auto-trigger compliance check if organization has MiFID enabled
    if (input.organizationId) {
        try {
            const org = await db.organization.findUnique({
                where: { id: input.organizationId }
            });

            // Check if MiFID is enabled (using any to bypass type check until Prisma client is regenerated)
            const mifidEnabled = (org as any)?.mifidEnabled === true;

            if (mifidEnabled) {
                // Import compliance service and trigger check
                const { checkMiFIDCompliance } = await import('./compliance.service');
                try {
                    const updatedAnalysis = await db.callAnalysis.findUnique({
                        where: { callId: call.id }
                    });
                    if (updatedAnalysis) {
                        await checkMiFIDCompliance(updatedAnalysis, input.organizationId);
                    }
                } catch (error) {
                    // Don't fail the call analysis if compliance check fails
                    logger.error('Failed to auto-trigger compliance check', { error, callId: call.id });
                }
            }
        } catch (error) {
            logger.error('Failed to check organization MiFID status', { error, organizationId: input.organizationId });
        }
    }

    return call as CallWithAnalysis;
};
