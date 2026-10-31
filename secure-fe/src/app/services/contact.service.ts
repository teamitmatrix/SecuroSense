import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ContactMessage {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiService = inject(ApiService);

  constructor() {}

  sendMessage(message: ContactMessage): Observable<any> {
    return this.apiService.post('contact', message);
  }
}
