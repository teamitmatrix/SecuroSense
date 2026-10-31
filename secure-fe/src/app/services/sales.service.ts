import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface SalesQuery {
    organizationId?: number | null;
    startDate?: string; // ISO string
    endDate?: string;   // ISO string
}

@Injectable({
    providedIn: 'root'
})
export class SalesService {
    constructor(private readonly api: ApiService) { }

    private toParams(query?: SalesQuery): { [key: string]: string } | undefined {
        const params: { [key: string]: string } = {};
        if (query?.organizationId !== null && query?.organizationId !== undefined) {
            params['organizationId'] = query.organizationId.toString();
        }
        if (query?.startDate) params['startDate'] = query.startDate;
        if (query?.endDate) params['endDate'] = query.endDate;
        return Object.keys(params).length > 0 ? params : undefined;
    }

    getStats(query?: SalesQuery): Observable<any> {
        return this.api.get('sales/stats', this.toParams(query));
    }

    getTeamPerformance(query?: SalesQuery): Observable<any[]> {
        return this.api.get('sales/team-performance', this.toParams(query));
    }

    getRevenueDistribution(query?: SalesQuery): Observable<any[]> {
        return this.api.get('sales/distribution', this.toParams(query));
    }
}
