import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { SyncResponse } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class IngestionService {

    constructor(private apiService: ApiService) { }

    /**
     * Trigger manual sync of calls from external system
     */
    triggerSync(): Observable<SyncResponse> {
        return this.apiService.post<SyncResponse>('ingestion/trigger-sync', {});
    }
}
