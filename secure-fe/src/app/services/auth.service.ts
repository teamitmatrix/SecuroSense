import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, tap } from 'rxjs';
import { User } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private readonly USER_KEY = 'auth_user';

    constructor(private apiService: ApiService) { }

    login(credentials: any): Observable<any> {
        return this.apiService.post<any>('auth/login', credentials).pipe(
            tap(res => this.setSession(res))
        );
    }

    register(data: any): Observable<any> {
        return this.apiService.post<any>('auth/register', data).pipe(
            tap(res => this.setSession(res))
        );
    }

    getMyProfile(): Observable<User> {
        return this.apiService.get<User>('auth/user/me');
    }

    updateMyProfile(data: {
        name?: string;
        nameAr?: string;
        email?: string;
        language?: 'en' | 'ar' | 'fr';
        currentPassword?: string;
        newPassword?: string;
    }): Observable<any> {
        return this.apiService.put<any>('auth/user/me', data).pipe(
            tap((res) => {
                if (res?.user) {
                    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
                    if (res.user.language) {
                        localStorage.setItem('app_language', res.user.language);
                    }
                }
            })
        );
    }

    public setSession(authResult: any): void {
        if (authResult.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, authResult.accessToken);
        }
        if (authResult.refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
        }
        if (authResult.user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
            
            // Sync language preference from user
            if (authResult.user.language) {
                localStorage.setItem('app_language', authResult.user.language);
            }
        }
    }

    refreshToken(): Observable<any> {
        const refreshToken = this.getRefreshToken();
        return this.apiService.post<any>('auth/refresh', { refreshToken }).pipe(
            tap(res => {
                if (res.accessToken) {
                    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
                }
            })
        );
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    getUser(): User | null {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    /**
     * Returns normalized role name (e.g. super_admin) from user payload,
     * with JWT payload role as fallback for stale/mismatched local user shape.
     */
    getNormalizedRole(): string {
        const user = this.getUser() as any;
        const roleValue = user?.role;

        const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, '_');

        if (typeof roleValue === 'string' && roleValue.trim()) {
            return normalize(roleValue);
        }

        if (roleValue && typeof roleValue.name === 'string' && roleValue.name.trim()) {
            return normalize(roleValue.name);
        }

        const token = this.getToken();
        if (!token) return '';

        try {
            const parts = token.split('.');
            if (parts.length < 2) return '';

            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
            const payload = JSON.parse(atob(padded));
            if (typeof payload?.role === 'string' && payload.role.trim()) {
                return normalize(payload.role);
            }
        } catch {
            return '';
        }

        return '';
    }
}
