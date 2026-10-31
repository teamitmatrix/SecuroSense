import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export const PERMISSIONS = {
    // Call Analysis
    VIEW_CALLS: 'VIEW_CALLS',
    ANALYZE_CALLS: 'ANALYZE_CALLS',
    DELETE_CALLS: 'DELETE_CALLS',
    DOWNLOAD_REPORTS: 'DOWNLOAD_REPORTS',

    // Teams
    VIEW_TEAMS: 'VIEW_TEAMS',
    MANAGE_TEAMS: 'MANAGE_TEAMS',

    // Users
    VIEW_USERS: 'VIEW_USERS',
    MANAGE_USERS: 'MANAGE_USERS',
    ASSIGN_PERMISSIONS: 'ASSIGN_PERMISSIONS',

    // QA Templates
    VIEW_QA_TEMPLATES: 'VIEW_QA_TEMPLATES',
    MANAGE_QA_TEMPLATES: 'MANAGE_QA_TEMPLATES',

    // Settings
    MANAGE_SETTINGS: 'MANAGE_SETTINGS',
    VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',

    // Organization
    MANAGE_ORGANIZATIONS: 'MANAGE_ORGANIZATIONS',

    // Analytics
    VIEW_ANALYTICS: 'VIEW_ANALYTICS',
    EXPORT_DATA: 'EXPORT_DATA',
} as const;

export type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS];

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    private userPermissions$ = new BehaviorSubject<PermissionName[]>([]);

    constructor() {
        this.loadUserPermissions();
    }

    /**
     * Load user permissions from local storage (set during login)
     */
    private loadUserPermissions(): void {
        const stored = localStorage.getItem('user_permissions');
        if (stored) {
            try {
                const permissions = JSON.parse(stored);
                this.userPermissions$.next(permissions);
            } catch (e) {
                console.error('Failed to parse user permissions', e);
            }
        }
    }

    /**
     * Set user permissions (called after login)
     */
    setPermissions(permissions: PermissionName[]): void {
        localStorage.setItem('user_permissions', JSON.stringify(permissions));
        this.userPermissions$.next(permissions);
    }

    /**
     * Clear permissions (called on logout)
     */
    clearPermissions(): void {
        localStorage.removeItem('user_permissions');
        this.userPermissions$.next([]);
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(permission: PermissionName): boolean {
        const permissions = this.userPermissions$.value;
        return permissions.includes(permission);
    }

    /**
     * Check if user has ANY of the specified permissions
     */
    hasAnyPermission(permissionList: PermissionName[]): boolean {
        const permissions = this.userPermissions$.value;
        return permissionList.some(p => permissions.includes(p));
    }

    /**
     * Check if user has ALL of the specified permissions
     */
    hasAllPermissions(permissionList: PermissionName[]): boolean {
        const permissions = this.userPermissions$.value;
        return permissionList.every(p => permissions.includes(p));
    }

    /**
     * Get observable of user permissions
     */
    getPermissions$(): Observable<PermissionName[]> {
        return this.userPermissions$.asObservable();
    }

    /**
     * Check if user is admin (has all permissions)
     */
    isAdmin(): boolean {
        const permissions = this.userPermissions$.value;
        return permissions.length >= Object.keys(PERMISSIONS).length;
    }
}
