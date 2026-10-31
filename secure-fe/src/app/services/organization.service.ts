// src/app/services/organization.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Organization {
    id: number;
    name: string;
    nameAr?: string | null;
    industry: string;
    industryAr?: string | null;
    size?: string;
    sizeAr?: string | null;
    address?: string | null;
    addressAr?: string | null;
    city?: string | null;
    cityAr?: string | null;
    state?: string | null;
    stateAr?: string | null;
    country?: string | null;
    countryAr?: string | null;
    postalCode?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    timezone?: string | null;
    taxId?: string | null;
    registrationNumber?: string | null;
    description?: string | null;
    descriptionAr?: string | null;
    foundedYear?: number | null;
    adminEmail: string | null;
    adminName: string | null;
    adminId: number | null;
    userCount?: number;
    teamCount?: number;
    callCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrganizationAdminPermissions {
    organizationId: number;
    organizationName: string;
    adminId: number;
    adminEmail: string;
    adminName: string;
    permissions: Array<{
        name: string;
        description: string;
        category: string;
        source: 'direct' | 'role';
    }>;
}

export interface CreateAdminUserInput {
    organizationId: number;
    email: string;
    password: string;
    name: string;
}

export interface CreateOrganizationInput {
    name: string;
    nameAr?: string;
    industry: string;
    industryAr?: string;
    size?: string;
    sizeAr?: string;
    email?: string;
    phone?: string;
    website?: string;
    country?: string;
    countryAr?: string;
    city?: string;
    cityAr?: string;
    state?: string;
    stateAr?: string;
    address?: string;
    addressAr?: string;
    postalCode?: string;
    description?: string;
    descriptionAr?: string;
    timezone?: string;
    taxId?: string;
    registrationNumber?: string;
    foundedYear?: number;
}

export interface UpdateOrganizationInput {
    name?: string;
    nameAr?: string;
    industry?: string;
    industryAr?: string;
    size?: string;
    sizeAr?: string;
    email?: string;
    phone?: string;
    website?: string;
    country?: string;
    countryAr?: string;
    city?: string;
    cityAr?: string;
    state?: string;
    stateAr?: string;
    address?: string;
    addressAr?: string;
    postalCode?: string;
    description?: string;
    descriptionAr?: string;
    timezone?: string;
    taxId?: string;
    registrationNumber?: string;
    foundedYear?: number | null;
}

@Injectable({
    providedIn: 'root'
})
export class OrganizationService {
    constructor(private apiService: ApiService) { }

    getAllOrganizations(): Observable<Organization[]> {
        return this.apiService.get<Organization[]>('organizations');
    }

    getOrganizationById(id: number): Observable<Organization> {
        return this.apiService.get<Organization>(`organizations/${id}`);
    }

    getMyOrganization(): Observable<Organization> {
        return this.apiService.get<Organization>('organizations/me');
    }

    updateMyOrganization(input: UpdateOrganizationInput): Observable<any> {
        return this.apiService.put('organizations/me', input);
    }

    getOrganizationAdminPermissions(organizationId: number): Observable<OrganizationAdminPermissions> {
        return this.apiService.get<OrganizationAdminPermissions>(`organizations/${organizationId}/admin/permissions`);
    }

    updateOrganizationAdminPermissions(organizationId: number, permissions: string[]): Observable<any> {
        return this.apiService.put(`organizations/${organizationId}/admin/permissions`, { permissions });
    }

    createAdminUser(input: CreateAdminUserInput): Observable<any> {
        return this.apiService.post('organizations/create-admin', input);
    }

    createOrganization(input: CreateOrganizationInput): Observable<any> {
        return this.apiService.post('organizations', input);
    }
}

