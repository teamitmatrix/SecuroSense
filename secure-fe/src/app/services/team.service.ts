import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TeamService {
    constructor(private apiService: ApiService) { }

    getTeams(): Observable<any[]> {
        return this.apiService.get<any[]>('teams');
    }

    getTeam(id: number): Observable<any> {
        return this.apiService.get<any>(`teams/${id}`);
    }

    createTeam(name: string): Observable<any> {
        return this.apiService.post<any>('teams', { name });
    }

    updateTeam(id: number, name: string): Observable<any> {
        return this.apiService.put<any>(`teams/${id}`, { name });
    }

    deleteTeam(id: number): Observable<any> {
        return this.apiService.delete<any>(`teams/${id}`);
    }

    getAgents(): Observable<any[]> {
        return this.apiService.get<any[]>('teams/agents/all');
    }

    createAgent(teamId: number, data: any): Observable<any> {
        return this.apiService.post<any>(`teams/${teamId}/agents`, data);
    }
}

