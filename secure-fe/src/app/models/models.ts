// User & Authentication Models
export interface User {
    id: number;
    email: string;
    name?: string;
    nameAr?: string;
    language?: 'en' | 'ar' | 'fr';
    role: string;
    teamId?: number;
    organizationId?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Team {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Promise {
    id: number;
    title: string;
    description?: string;
    status: string;
    dueDate: Date;
    userId: number;
    categoryId: number;
    createdAt: Date;
    updatedAt: Date;
}

// Call Analytics Models
export interface Call {
    id: number;
    agentId?: number;
    customerName?: string;
    customerNameAr?: string;
    duration: number;
    recordingUrl?: string;
    transcript?: string;
    transcriptAr?: string | null;
    language?: string;
    timestamp: Date;
    analysis?: CallAnalysis;
    leadId?: number;
    agentName?: string;
    agentNameAr?: string;
    customerPhone?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Lead {
    id: number;
    customerName?: string;
    customerNameAr?: string;
    customerPhone?: string;
    status: string;
    calls?: Call[];
    _count?: {
        calls: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CallAnalysis {
    id: number;
    callId: number;
    sentiment?: string;
    sentimentAr?: string | null;
    keywords: string[];
    keywordsAr?: string[];
    topics: string[];
    topicsAr?: string[];
    actionItems: string[];
    actionItemsAr?: string[];
    summary?: string;
    summaryAr?: string | null;
    score?: number;
    callType?: string;
    callTypeAr?: string | null;
    wasDealClosed?: boolean;
    agentDetails?: any;
    agentDetailsAr?: any;
    coachingTips?: string;
    coachingTipsAr?: string | null;
    objections?: string[];
    objectionsAr?: string[] | null;
    qaResults?: Array<{
        parameter: string;
        status: 'PASS' | 'FAIL' | 'N/A';
        notes: string;
    }>;
    qaResultsAr?: Array<{
        parameter: string;
        status: 'PASS' | 'FAIL' | 'N/A';
        notes: string;
    }>;
    // MiFID Compliance Fields
    mifidCompliance?: {
        suitabilityAssessment?: boolean;
        bestExecution?: boolean;
        clientCategorization?: 'RETAIL' | 'PROFESSIONAL' | 'ELIGIBLE_COUNTERPARTY' | null;
        regulatoryDisclosures?: boolean;
        overallStatus?: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
        violations?: string[];
        score?: number;
    };
    suitabilityScore?: number | null;
    bestExecutionCheck?: boolean | null;
    clientCategory?: 'RETAIL' | 'PROFESSIONAL' | 'ELIGIBLE_COUNTERPARTY' | null;
    /**
     * Extended compliance & fraud risk fields for SecuroSense 2.0
     * These are optional so they don't break existing backends.
     */
    // Compliance summary signals
    scriptAdherenceScore?: number | null;
    riskDisclosureStatus?: 'COMPLIANT' | 'MISSING' | 'PARTIAL' | null;
    misSellingDetected?: boolean | null;
    falsePromiseDetected?: boolean | null;
    harassmentDetected?: boolean | null;
    complaintHandledProperly?: boolean | null;

    // Fraud detection signals
    suspiciousPhrases?: string[];
    pressureSellingIndicators?: string[];
    financialManipulationKeywords?: string[];
    repeatedCallPatternDetected?: boolean | null;
    riskyToneScore?: number | null;          // 0–1
    fraudProbability?: number | null;        // 0–1

    // Regulatory checks
    missingMandatoryDisclosures?: string[];
    regulatoryViolationKeywords?: string[];
    escalationRequired?: boolean | null;

    // Unified risk scoring (can be computed on BE or FE)
    callRiskScore?: number | null;           // 0–100
    callRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
    complianceStatus?: 'COMPLIANT' | 'RISKY' | 'HIGH_RISK' | 'FRAUD_ALERT' | null;

    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedCalls {
    calls: Call[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedLeads {
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// API Request/Response Types
export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface AnalyzeCallRequest {
    transcript: string;
    customerName?: string;
    duration?: number;
}

export interface SyncResponse {
    message: string;
    processed: number;
    calls: Call[];
}

export interface ApiError {
    error: string;
    message?: string;
}
