import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface QAParameter {
    name: string;
    description: string;
    passCriteria: string;
    weight?: number;
}

export interface QATemplate {
    id: number;
    name: string;
    nameAr?: string | null;
    description?: string;
    industry: string;
    isActive: boolean;
    parameters: QAParameter[];
    createdAt: string;
    updatedAt: string;
    createdBy?: number;
    organizationId?: number | null;
    organization?: {
        id: number;
        name: string;
    } | null;
    organizationsUsing?: Array<{ id: number; name: string }>;
    usageCount?: number;
}

export interface CreateQATemplateInput {
    name: string;
    nameAr?: string | null;
    description?: string;
    industry: string;
    parameters: QAParameter[];
    organizationId?: number | null; // For super_admin: can create for specific organization or global (null)
}

@Injectable({
    providedIn: 'root'
})
export class QaTemplateService {
    constructor(private readonly apiService: ApiService) { }

    /**
     * Get all QA templates
     * @param industry Optional industry filter
     * @param includeUsage For super_admin: include which organizations are using each template
     */
    getAllTemplates(industry?: string, includeUsage = false): Observable<QATemplate[]> {
        let url = 'qa-templates';
        const params: string[] = [];
        if (industry) {
            params.push(`industry=${encodeURIComponent(industry)}`);
        }
        if (includeUsage) {
            params.push('includeUsage=true');
        }
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        return this.apiService.get<QATemplate[]>(url);
    }

    /**
     * Get template by ID
     */
    getTemplateById(id: number): Observable<QATemplate> {
        return this.apiService.get<QATemplate>(`qa-templates/${id}`);
    }

    /**
     * Create new QA template
     */
    createTemplate(input: CreateQATemplateInput): Observable<QATemplate> {
        return this.apiService.post<QATemplate>('qa-templates', input);
    }

    /**
     * Update existing template
     */
    updateTemplate(id: number, updates: Partial<CreateQATemplateInput>): Observable<QATemplate> {
        return this.apiService.put<QATemplate>(`qa-templates/${id}`, updates);
    }

    /**
     * Delete (deactivate) template
     */
    deleteTemplate(id: number): Observable<{ message: string }> {
        return this.apiService.delete<{ message: string }>(`qa-templates/${id}`);
    }

    /**
     * Seed default templates (admin only)
     */
    seedDefaultTemplates(): Observable<{ message: string }> {
        return this.apiService.post<{ message: string }>('qa-templates/seed', {});
    }

    /**
     * Copy template to organization (Organization Admin)
     */
    copyTemplateToOrganization(templateId: number): Observable<QATemplate> {
        return this.apiService.post<QATemplate>(`qa-templates/${templateId}/copy`, {});
    }

    /**
     * Get organization's QA template (for call analysis)
     */
    getOrganizationTemplate(): Observable<QATemplate> {
        return this.apiService.get<QATemplate>('qa-templates/organization/me');
    }
}
