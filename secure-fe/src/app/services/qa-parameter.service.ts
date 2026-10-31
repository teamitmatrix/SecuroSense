import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface GlobalQAParameter {
    id: number;
    name: string;
    nameAr?: string | null;
    description: string;
    descriptionAr?: string | null;
    passCriteria: string;
    passCriteriaAr?: string | null;
    industry: string;
    weight: number;
    isActive: boolean;
    organizationId?: number | null;
    organization?: {
        id: number;
        name: string;
        industry: string;
    } | null;
}

@Injectable({
    providedIn: 'root'
})
export class QaParameterService {
    constructor(private readonly api: ApiService) { }

    getAll(industry?: string): Observable<GlobalQAParameter[]> {
        const url = industry ? `qa-parameters?industry=${industry}` : 'qa-parameters';
        return this.api.get<GlobalQAParameter[]>(url);
    }

    create(data: any): Observable<GlobalQAParameter> {
        return this.api.post<GlobalQAParameter>('qa-parameters', data);
    }

    update(id: number, data: any): Observable<GlobalQAParameter> {
        return this.api.put<GlobalQAParameter>(`qa-parameters/${id}`, data);
    }

    delete(id: number): Observable<any> {
        return this.api.delete(`qa-parameters/${id}`);
    }
}
