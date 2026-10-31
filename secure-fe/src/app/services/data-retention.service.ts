// src/app/services/data-retention.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DataRetentionPolicy {
    id: number;
    organizationId: number;
    dataType: 'CALLS' | 'TRANSCRIPTS' | 'RECORDINGS' | 'ANALYSIS' | 'AUDIT_LOGS';
    retentionPeriodDays: number;
    autoDeleteEnabled: boolean;
    lastCleanupDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface RetentionStatus {
    policies: Array<{
        dataType: string;
        retentionPeriodDays: number;
        autoDeleteEnabled: boolean;
        lastCleanupDate?: string;
    }>;
    totalPolicies: number;
    activePolicies: number;
}

@Injectable({
    providedIn: 'root'
})
export class DataRetentionService {
    constructor(private readonly api: ApiService) {}

    /**
     * Get data retention policies
     */
    getPolicies(): Observable<DataRetentionPolicy[]> {
        return this.api.get<DataRetentionPolicy[]>('data-retention/policies');
    }

    /**
     * Create or update data retention policy
     */
    createPolicy(policy: {
        dataType: 'CALLS' | 'TRANSCRIPTS' | 'RECORDINGS' | 'ANALYSIS' | 'AUDIT_LOGS';
        retentionPeriodDays: number;
        autoDeleteEnabled?: boolean;
    }): Observable<DataRetentionPolicy> {
        return this.api.post<DataRetentionPolicy>('data-retention/policies', policy);
    }

    /**
     * Get retention status
     */
    getStatus(): Observable<RetentionStatus> {
        return this.api.get<RetentionStatus>('data-retention/status');
    }

    /**
     * Trigger manual cleanup
     */
    triggerCleanup(): Observable<{
        message: string;
        archived: number;
        deleted: number;
        errors: number;
    }> {
        return this.api.post('data-retention/cleanup', {});
    }
}

