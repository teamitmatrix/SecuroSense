import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Call, AnalyzeCallRequest, PaginatedCalls, Lead, PaginatedLeads } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class CallAnalysisService {

    constructor(private readonly apiService: ApiService) { }

    /**
     * Upload and analyze an audio recording
     * @param file Audio file to upload
     * @param customerName Customer name
     * @param customerNumber Customer phone number (optional)
     * @param agentName Agent name (optional)
     * @param leadId Lead ID (optional, if uploading to existing lead)
     */
    uploadRecording(
        file: File,
        metadata: {
            customerName?: string;
            customerNameAr?: string;
            customerNumber?: string;
            agentName?: string;
            leadId?: number;
            organizationId?: number | null;
        }
    ): Observable<Call> {
        const formData = new FormData();
        formData.append('recording', file);
        if (metadata.customerName) {
            formData.append('customerName', metadata.customerName);
        }
        if (metadata.customerNameAr) {
            formData.append('customerNameAr', metadata.customerNameAr);
        }
        if (metadata.customerNumber) {
            formData.append('customerNumber', metadata.customerNumber);
        }
        if (metadata.agentName) {
            formData.append('agentName', metadata.agentName);
        }
        if (metadata.leadId) {
            formData.append('leadId', metadata.leadId.toString());
        }
        if (metadata.organizationId !== null && metadata.organizationId !== undefined) {
            formData.append('organizationId', metadata.organizationId.toString());
        }
        return this.apiService.upload<Call>('analysis/upload', formData);
    }

    /**
     * Analyze a transcript directly
     * @param transcript Call transcript text
     * @param customerName Customer name (optional)
     * @param duration Call duration in seconds (optional)
     */
    analyzeTranscript(transcript: string, customerName?: string, duration?: number): Observable<Call> {
        const request: AnalyzeCallRequest = {
            transcript,
            customerName,
            duration
        };
        return this.apiService.post<Call>('analysis/analyze', request);
    }

    /**
     * Get all leads with pagination
     * @param page Page number
     * @param limit Items per page
     * @param organizationId Optional organization ID to filter by
     */
    getLeads(page: number = 1, limit: number = 10, organizationId?: number | null): Observable<PaginatedLeads> {
        const params: { [key: string]: string } = {
            page: page.toString(),
            limit: limit.toString()
        };
        if (organizationId !== null && organizationId !== undefined) {
            params['organizationId'] = organizationId.toString();
        }
        return this.apiService.get<PaginatedLeads>('analysis/leads', params);
    }

    /**
     * Get a specific lead by ID with interaction history
     * @param leadId Lead ID
     */
    getLeadById(leadId: number): Observable<Lead> {
        return this.apiService.get<Lead>(`analysis/leads/${leadId}`);
    }

    /**
     * Get all analyzed calls with pagination (Legacy/General)
     */
    getCalls(page: number = 1, limit: number = 10): Observable<PaginatedCalls> {
        return this.apiService.get<PaginatedCalls>(`analysis?page=${page}&limit=${limit}`);
    }

    /**
     * Get a specific call by ID
     */
    getCallById(callId: number): Observable<Call> {
        return this.apiService.get<Call>(`analysis/${callId}`);
    }

    /**
     * Get the PDF download URL for a call
     */
    getPdfUrl(callId: number, token?: string, language?: string): string {
        const base = `${environment.apiUrl}/analysis/${callId}/pdf`;
        const queryParams: string[] = [];
        if (token) {
            queryParams.push(`token=${encodeURIComponent(token)}`);
        }
        if (language) {
            queryParams.push(`lang=${encodeURIComponent(language)}`);
        }
        if (queryParams.length === 0) return base;
        // NOTE: token in URL is only for file downloads in new tabs.
        // Prefer Authorization header for API calls where possible.
        return `${base}?${queryParams.join('&')}`;
    }

    /**
     * Get aggregated performance stats for agents
     */
    getAgentPerformance(): Observable<any[]> {
        return this.apiService.get<any[]>('analysis/performance/agents');
    }
}
