import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Role {
    id: number;
    name: string;
    description?: string;
    isSystem: boolean;
    organizationId?: number | null;
    organization?: {
        id: number;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
    permissions: RolePermission[];
    _count?: {
        users: number;
    };
    users?: any[];
}

export interface RolePermission {
    id: number;
    roleId: number;
    permissionId: number;
    permission: Permission;
    grantedAt: string;
}

export interface Permission {
    id: number;
    name: string;
    description?: string;
    category: string;
}

export interface CreateRoleInput {
    name: string;
    description?: string;
    permissions: string[]; // Array of permission names
    targetOrganizationId?: number | null; // For super_admin: null = system role, number = org-specific role
}

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    constructor(private apiService: ApiService) { }

    getAllRoles(): Observable<Role[]> {
        return this.apiService.get<Role[]>('roles');
    }

    getRoleById(id: number): Observable<Role> {
        return this.apiService.get<Role>(`roles/${id}`);
    }

    createRole(data: CreateRoleInput): Observable<Role> {
        return this.apiService.post<Role>('roles', data);
    }

    updateRole(id: number, data: Partial<CreateRoleInput>): Observable<Role> {
        return this.apiService.put<Role>(`roles/${id}`, data);
    }

    deleteRole(id: number): Observable<any> {
        return this.apiService.delete<any>(`roles/${id}`);
    }

    seedDefaultRoles(): Observable<any> {
        return this.apiService.post<any>('roles/seed', {});
    }

    getAvailablePermissions(): Observable<Permission[]> {
        return this.apiService.get<Permission[]>('roles/permissions');
    }
}
