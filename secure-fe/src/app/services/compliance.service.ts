// src/app/services/compliance.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ComplianceRule {
    id: number;
    name: string;
    description?: string;
    regulation: string;
    severity: string;
    requiredChecks: any;
    isActive: boolean;
    organizationId?: number;
    organization?: {
        id: number;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ComplianceCheck {
    id: number;
    callId: number;
    ruleId: number;
    rule: ComplianceRule;
    status: 'PASS' | 'FAIL' | 'N/A';
    details?: any;
    checkedAt: string;
    checkedBy?: number;
}

export interface MiFIDComplianceResult {
    suitabilityAssessment: boolean;
    bestExecution: boolean;
    clientCategorization: boolean;
    recordKeeping: boolean;
    transactionReporting: boolean;
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
    violations: string[];
    score: number;
}

export interface SuitabilityAssessment {
    id: number;
    callId?: number;
    leadId: number;
    riskProfile?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
    investmentObjectives?: string[];
    knowledgeExperience?: string[];
    financialSituation?: string[];
    assessmentResult?: any;
    assessedBy?: number;
    assessmentDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClientCategorization {
    id: number;
    leadId: number;
    category: 'RETAIL' | 'PROFESSIONAL' | 'ELIGIBLE_COUNTERPARTY';
    assessmentDate: string;
    assessmentDetails?: any;
    assessedBy?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ComplianceReport {
    organizationId: number;
    period: {
        startDate: string;
        endDate: string;
    };
    summary: {
        totalCalls: number;
        compliantCalls: number;
        complianceRate: number;
    };
    insights?: {
        complianceSummary?: {
            posture?: 'COMPLIANT' | 'RISKY' | 'HIGH_RISK';
            scriptAdherencePercent?: number | null;
            riskDisclosures?: {
                compliant: number;
                missing: number;
                unknown: number;
                statusLabel: 'Complete' | 'Partial' | 'Missing' | 'Unknown';
            };
            misSelling?: null;
            harassment?: null;
        };
        fraudRisk?: {
            probabilityPercent?: number;
            riskyToneScorePercent?: number | null;
            topPhrase?: string | null;
        };
        regulatoryCheck?: {
            escalationRequired?: boolean;
            missingDisclosuresCount?: number;
            violationKeywordsCount?: number;
        };
    };
    ruleStatistics: Record<string, {
        total: number;
        pass: number;
        fail: number;
        na: number;
    }>;
    generatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class ComplianceService {
    constructor(private readonly api: ApiService) {}

    /**
     * Get all compliance rules
     */
    getComplianceRules(): Observable<ComplianceRule[]> {
        return this.api.get<ComplianceRule[]>('compliance/rules');
    }

    /**
     * Create a new compliance rule (super_admin only)
     */
    createComplianceRule(rule: {
        name: string;
        description?: string;
        regulation: string;
        severity?: string;
        requiredChecks?: any;
        organizationId?: number;
    }): Observable<ComplianceRule> {
        return this.api.post<ComplianceRule>('compliance/rules', rule);
    }

    /**
     * Get compliance checks for a call
     */
    getComplianceChecks(callId: number): Observable<ComplianceCheck[]> {
        return this.api.get<ComplianceCheck[]>(`compliance/checks/${callId}`);
    }

    /**
     * Run compliance check on a call
     */
    runComplianceCheck(callId: number): Observable<{
        complianceResult: MiFIDComplianceResult;
        checks: ComplianceCheck[];
    }> {
        return this.api.post(`compliance/checks/${callId}`, {});
    }

    /**
     * Get suitability assessments for a lead
     */
    getSuitabilityAssessments(leadId: number): Observable<SuitabilityAssessment[]> {
        return this.api.get<SuitabilityAssessment[]>(`compliance/suitability/${leadId}`);
    }

    /**
     * Create or update suitability assessment
     */
    createSuitabilityAssessment(leadId: number, assessment: {
        callId?: number;
        riskProfile?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
        investmentObjectives?: string[];
        knowledgeExperience?: string[];
        financialSituation?: string[];
    }): Observable<any> {
        return this.api.post(`compliance/suitability/${leadId}`, assessment);
    }

    /**
     * Get client categorization
     */
    getClientCategorization(leadId: number): Observable<ClientCategorization> {
        return this.api.get<ClientCategorization>(`compliance/categorization/${leadId}`);
    }

    /**
     * Update client categorization
     */
    updateClientCategorization(leadId: number, categorization: {
        category: 'RETAIL' | 'PROFESSIONAL' | 'ELIGIBLE_COUNTERPARTY';
        assessmentDetails?: any;
    }): Observable<ClientCategorization> {
        return this.api.post(`compliance/categorization/${leadId}`, categorization);
    }

    /**
     * Check best execution compliance
     */
    checkBestExecution(callId: number): Observable<{ bestExecutionVerified: boolean }> {
        return this.api.post(`compliance/best-execution/${callId}`, {});
    }

    /**
     * Generate compliance report
     */
    generateComplianceReport(startDate?: Date, endDate?: Date): Observable<ComplianceReport> {
        const params: any = {};
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();
        return this.api.get<ComplianceReport>('compliance/reports', params);
    }
}

