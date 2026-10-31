import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export type PromiseStatus = 'PENDING' | 'FULFILLED' | 'BROKEN';

export interface PromiseCategoryDto {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class PromiseService {
    constructor(private readonly api: ApiService) { }

    getStats(organizationId?: number | null): Observable<any> {
        const params: { [key: string]: string } = {};
        if (organizationId !== null && organizationId !== undefined) {
            params['organizationId'] = organizationId.toString();
        }
        return this.api.get('promises/stats', params);
    }

    getCategories(): Observable<PromiseCategoryDto[]> {
        return this.api.get<PromiseCategoryDto[]>('promises/categories');
    }

    createCategory(name: string): Observable<PromiseCategoryDto> {
        return this.api.post<PromiseCategoryDto>('promises/categories', { name });
    }

    getAllPromises(filters: Record<string, string | number | null | undefined> = {}): Observable<any[]> {
        const params: { [key: string]: string } = {};
        for (const [key, value] of Object.entries(filters)) {
            if (value === null || value === undefined || value === '') continue;
            params[key] = String(value);
        }
        return this.api.get<any[]>('promises', params);
    }

    createPromise(data: any): Observable<any> {
        return this.api.post('promises', data);
    }

    updateStatus(id: number, status: string): Observable<any> {
        return this.api.patch(`promises/${id}/status`, { status });
    }

    updatePromise(id: number, data: any): Observable<any> {
        return this.api.put(`promises/${id}`, data);
    }

    deletePromise(id: number): Observable<any> {
        return this.api.delete(`promises/${id}`);
    }
}
