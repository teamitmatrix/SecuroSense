// src/app/components/management/organization-management/organization-management.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService, Organization, OrganizationAdminPermissions, CreateAdminUserInput, CreateOrganizationInput } from '../../../services/organization.service';
import { PermissionService, PERMISSIONS } from '../../../services/permission.service';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
    selector: 'app-organization-management',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    template: `
    <div class="p-8 h-full overflow-y-auto">
      <!-- Header -->
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-semibold text-white mb-1">{{ 'organization.management' | translate }}</h1>
          <p class="text-slate-400 text-sm">{{ 'organization.managementDesc' | translate }}</p>
        </div>
        <button 
          (click)="openCreateOrganizationModal()"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          {{ 'organization.createOrganization' | translate }}
        </button>
      </div>

      <!-- Organizations Table -->
      <div *ngIf="!isLoading" class="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-900 border-b border-slate-700">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Organization</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Industry</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Email</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Users</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700">
              <tr *ngFor="let org of organizations" class="hover:bg-slate-750 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-white font-medium">{{ org.name }}</div>
                  <div *ngIf="org.nameAr" class="text-sm text-slate-400" dir="rtl">{{ org.nameAr }}</div>
                  <div class="text-sm text-slate-500">{{ org.size || 'N/A' }}<span *ngIf="org.sizeAr"> / {{ org.sizeAr }}</span></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-emerald-600/20 text-emerald-400 text-xs rounded-full">{{ org.industry }}</span>
                  <div *ngIf="org.industryAr" class="text-xs text-slate-400 mt-1" dir="rtl">{{ org.industryAr }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-slate-300">{{ org.adminEmail || 'No Admin' }}</div>
                  <div class="text-xs text-slate-500">{{ org.adminName || '' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-slate-300">
                  {{ org.userCount || 0 }} users
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex gap-2">
                    <button 
                      (click)="viewOrganizationDetails(org)"
                      class="px-3 py-1.5 bg-purple-600/20 text-purple-400 rounded text-xs hover:bg-purple-600/30 transition-all"
                      title="View Details"
                    >
                      {{ 'organization.viewDetails' | translate }}
                    </button>
                    <button 
                      (click)="viewPermissions(org)"
                      class="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-all"
                      title="View Permissions"
                    >
                      {{ 'organization.permissions' | translate }}
                    </button>
                    <button 
                      (click)="openCreateAdminModal(org)"
                      class="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded text-xs hover:bg-emerald-600/30 transition-all"
                      title="Create Admin"
                    >
                      + {{ 'organization.admin' | translate }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && organizations.length === 0" class="text-center py-20">
        <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <p class="text-slate-400 text-lg mb-2">No organizations found</p>
      </div>

      <!-- Create Admin Modal -->
      <div 
        *ngIf="isCreateAdminModalOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="closeCreateAdminModal()"
      >
        <div 
          class="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="border-b border-slate-700 px-6 py-4">
            <h2 class="text-xl font-semibold text-white">Create Admin User</h2>
            <p class="text-sm text-slate-400 mt-1">{{ selectedOrg?.name }}</p>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Name*</label>
              <input 
                type="text"
                [(ngModel)]="adminFormData.name"
                placeholder="Admin Name"
                class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Email*</label>
              <input 
                type="email"
                [(ngModel)]="adminFormData.email"
                placeholder="admin@example.com"
                class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Password*</label>
              <input 
                type="password"
                [(ngModel)]="adminFormData.password"
                placeholder="Secure password"
                class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div class="border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
            <button 
              (click)="closeCreateAdminModal()"
              class="px-4 py-2 bg-slate-800 text-slate-300 rounded-md text-sm hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button 
              (click)="createAdminUser()"
              [disabled]="isSaving || !isAdminFormValid()"
              class="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span *ngIf="isSaving" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Create Admin
            </button>
          </div>
        </div>
      </div>

      <!-- View Organization Details Modal -->
      <div 
        *ngIf="isViewDetailsModalOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="closeViewDetailsModal()"
      >
        <div 
          class="bg-slate-900 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="border-b border-slate-700 px-6 py-4">
            <h2 class="text-xl font-semibold text-white">{{ 'organization.organizationDetails' | translate }}</h2>
            <p class="text-sm text-slate-400 mt-1">{{ selectedOrg?.name }}</p>
          </div>

          <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
            <div *ngIf="isLoadingDetails" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              <p class="text-slate-400 mt-4">{{ 'common.loading' | translate }}</p>
            </div>
            <div *ngIf="!isLoadingDetails && organizationDetails" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-white font-semibold mb-4">{{ 'organization.basicInfo' | translate }}</h3>
                <div class="space-y-3">
                  <div>
                    <span class="text-slate-400 text-sm">{{ 'organization.name' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.name }}</span>
                    <p *ngIf="organizationDetails.nameAr" class="text-slate-400 text-sm mt-0.5 ml-2" dir="rtl">{{ organizationDetails.nameAr }}</p>
                  </div>
                  <div>
                    <span class="text-slate-400 text-sm">{{ 'organization.industry' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.industry }}</span>
                    <p *ngIf="organizationDetails.industryAr" class="text-slate-400 text-sm mt-0.5 ml-2" dir="rtl">{{ organizationDetails.industryAr }}</p>
                  </div>
                  <div *ngIf="organizationDetails.size">
                    <span class="text-slate-400 text-sm">{{ 'organization.size' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.size }}</span>
                    <p *ngIf="organizationDetails.sizeAr" class="text-slate-400 text-sm mt-0.5 ml-2" dir="rtl">{{ organizationDetails.sizeAr }}</p>
                  </div>
                  <div *ngIf="organizationDetails.description">
                    <span class="text-slate-400 text-sm">{{ 'organization.description' | translate }}:</span>
                    <p class="text-white ml-2 mt-1">{{ organizationDetails.description }}</p>
                    <p *ngIf="organizationDetails.descriptionAr" class="text-slate-400 text-sm mt-1 ml-2" dir="rtl">{{ organizationDetails.descriptionAr }}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-white font-semibold mb-4">{{ 'organization.contactInfo' | translate }}</h3>
                <div class="space-y-3">
                  <div *ngIf="organizationDetails.email">
                    <span class="text-slate-400 text-sm">{{ 'organization.email' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.email }}</span>
                  </div>
                  <div *ngIf="organizationDetails.phone">
                    <span class="text-slate-400 text-sm">{{ 'organization.phone' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.phone }}</span>
                  </div>
                  <div *ngIf="organizationDetails.website">
                    <span class="text-slate-400 text-sm">{{ 'organization.website' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.website }}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-white font-semibold mb-4">{{ 'organization.address' | translate }}</h3>
                <div class="space-y-3">
                  <div *ngIf="organizationDetails.address">
                    <span class="text-slate-400 text-sm">{{ 'organization.address' | translate }}:</span>
                    <p class="text-white ml-2 mt-1">{{ organizationDetails.address }}</p>
                    <p *ngIf="organizationDetails.addressAr" class="text-slate-400 text-sm mt-0.5 ml-2" dir="rtl">{{ organizationDetails.addressAr }}</p>
                  </div>
                  <div *ngIf="organizationDetails.city">
                    <span class="text-slate-400 text-sm">{{ 'organization.city' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.city }}</span>
                    <span *ngIf="organizationDetails.cityAr" class="text-slate-400 text-sm ml-2" dir="rtl"> / {{ organizationDetails.cityAr }}</span>
                  </div>
                  <div *ngIf="organizationDetails.state">
                    <span class="text-slate-400 text-sm">{{ 'organization.state' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.state }}</span>
                    <span *ngIf="organizationDetails.stateAr" class="text-slate-400 text-sm ml-2" dir="rtl"> / {{ organizationDetails.stateAr }}</span>
                  </div>
                  <div *ngIf="organizationDetails.country">
                    <span class="text-slate-400 text-sm">{{ 'organization.country' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.country }}</span>
                    <span *ngIf="organizationDetails.countryAr" class="text-slate-400 text-sm ml-2" dir="rtl"> / {{ organizationDetails.countryAr }}</span>
                  </div>
                  <div *ngIf="organizationDetails.postalCode">
                    <span class="text-slate-400 text-sm">{{ 'organization.postalCode' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.postalCode }}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-white font-semibold mb-4">{{ 'organization.additionalInfo' | translate }}</h3>
                <div class="space-y-3">
                  <div *ngIf="organizationDetails.userCount !== undefined">
                    <span class="text-slate-400 text-sm">{{ 'organization.users' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.userCount }}</span>
                  </div>
                  <div *ngIf="organizationDetails.teamCount !== undefined">
                    <span class="text-slate-400 text-sm">{{ 'organization.teams' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.teamCount }}</span>
                  </div>
                  <div *ngIf="organizationDetails.callCount !== undefined">
                    <span class="text-slate-400 text-sm">{{ 'organization.calls' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.callCount }}</span>
                  </div>
                  <div *ngIf="organizationDetails.foundedYear">
                    <span class="text-slate-400 text-sm">{{ 'organization.foundedYear' | translate }}:</span>
                    <span class="text-white ml-2">{{ organizationDetails.foundedYear }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-slate-700 px-6 py-4 flex justify-end">
            <button 
              (click)="closeViewDetailsModal()"
              class="px-4 py-2 bg-slate-800 text-slate-300 rounded-md text-sm hover:bg-slate-700 transition-all"
            >
              {{ 'common.close' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create Organization Modal -->
      <div 
        *ngIf="isCreateOrganizationModalOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="closeCreateOrganizationModal()"
      >
        <div 
          class="bg-slate-900 border border-slate-700 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="border-b border-slate-700 px-6 py-4">
            <h2 class="text-xl font-semibold text-white">{{ 'organization.createOrganization' | translate }}</h2>
            <p class="text-sm text-slate-400 mt-1">{{ 'organization.createOrganizationDesc' | translate }}</p>
          </div>

          <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
            <form (ngSubmit)="createOrganization()" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.name' | translate }} *</label>
                  <input 
                    type="text"
                    [(ngModel)]="orgFormData.name"
                    name="name"
                    required
                    class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <label class="block text-xs text-slate-500 mt-1 mb-1">Name (Arabic) <span class="text-slate-600">optional</span></label>
                  <input type="text" [(ngModel)]="orgFormData.nameAr" name="nameAr" dir="auto" placeholder="الاسم بالعربية" class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.industry' | translate }} *</label>
                  <input 
                    type="text"
                    [(ngModel)]="orgFormData.industry"
                    name="industry"
                    required
                    class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <label class="block text-xs text-slate-500 mt-1 mb-1">Industry (Arabic)</label>
                  <input type="text" [(ngModel)]="orgFormData.industryAr" name="industryAr" dir="auto" placeholder="بالعربية" class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.size' | translate }}</label>
                  <input 
                    type="text"
                    [(ngModel)]="orgFormData.size"
                    name="size"
                    class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <label class="block text-xs text-slate-500 mt-1 mb-1">Size (Arabic)</label>
                  <input type="text" [(ngModel)]="orgFormData.sizeAr" name="sizeAr" dir="auto" class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.email' | translate }}</label>
                  <input 
                    type="email"
                    [(ngModel)]="orgFormData.email"
                    name="email"
                    class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.phone' | translate }}</label>
                  <input 
                    type="text"
                    [(ngModel)]="orgFormData.phone"
                    name="phone"
                    class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.website' | translate }}</label>
                  <input 
                    type="url"
                    [(ngModel)]="orgFormData.website"
                    name="website"
                    class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.country' | translate }}</label>
                  <input type="text" [(ngModel)]="orgFormData.country" name="country" class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  <input type="text" [(ngModel)]="orgFormData.countryAr" name="countryAr" dir="auto" placeholder="Country (Arabic)" class="w-full mt-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.city' | translate }}</label>
                  <input type="text" [(ngModel)]="orgFormData.city" name="city" class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  <input type="text" [(ngModel)]="orgFormData.cityAr" name="cityAr" dir="auto" placeholder="City (Arabic)" class="w-full mt-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.state' | translate }}</label>
                  <input type="text" [(ngModel)]="orgFormData.state" name="state" class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  <input type="text" [(ngModel)]="orgFormData.stateAr" name="stateAr" dir="auto" placeholder="State (Arabic)" class="w-full mt-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.address' | translate }}</label>
                  <textarea [(ngModel)]="orgFormData.address" name="address" rows="2" class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"></textarea>
                  <label class="block text-xs text-slate-500 mt-1 mb-1">Address (Arabic)</label>
                  <textarea [(ngModel)]="orgFormData.addressAr" name="addressAr" dir="auto" rows="2" class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"></textarea>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.postalCode' | translate }}</label>
                  <input 
                    type="text"
                    [(ngModel)]="orgFormData.postalCode"
                    name="postalCode"
                    class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.foundedYear' | translate }}</label>
                  <input 
                    type="number"
                    [(ngModel)]="orgFormData.foundedYear"
                    name="foundedYear"
                    min="1900"
                    max="2100"
                    class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-300 mb-2">{{ 'organization.description' | translate }}</label>
                  <textarea [(ngModel)]="orgFormData.description" name="description" rows="3" class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"></textarea>
                  <label class="block text-xs text-slate-500 mt-1 mb-1">Description (Arabic)</label>
                  <textarea [(ngModel)]="orgFormData.descriptionAr" name="descriptionAr" dir="auto" rows="2" class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"></textarea>
                </div>
              </div>

              <div *ngIf="errorMessage" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {{ errorMessage }}
              </div>

              <div class="border-t border-slate-700 pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  (click)="closeCreateOrganizationModal()"
                  class="px-4 py-2 bg-slate-800 text-slate-300 rounded-md text-sm hover:bg-slate-700 transition-all"
                >
                  {{ 'common.cancel' | translate }}
                </button>
                <button 
                  type="submit"
                  [disabled]="isSaving || !isOrgFormValid()"
                  class="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span *ngIf="isSaving" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  {{ 'organization.create' | translate }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Permissions Modal -->
      <div 
        *ngIf="isPermissionsModalOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="closePermissionsModal()"
      >
        <div 
          class="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="border-b border-slate-700 px-6 py-4">
            <h2 class="text-xl font-semibold text-white">Admin Permissions</h2>
            <p class="text-sm text-slate-400 mt-1">{{ selectedOrg?.name }} - {{ selectedOrg?.adminEmail }}</p>
          </div>

          <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
            <div *ngIf="adminPermissions" class="space-y-4">
              <div *ngFor="let perm of adminPermissions.permissions" class="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="text-white font-medium">{{ perm.name }}</h4>
                    <p class="text-sm text-slate-400 mt-1">{{ perm.description }}</p>
                  </div>
                  <span class="px-2 py-1 bg-emerald-600/20 text-emerald-400 text-xs rounded" [title]="perm.source">
                    {{ perm.source }}
                  </span>
                </div>
              </div>
            </div>

            <div *ngIf="isLoadingPermissions" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            </div>
          </div>

          <div class="border-t border-slate-700 px-6 py-4 flex justify-end">
            <button 
              (click)="closePermissionsModal()"
              class="px-4 py-2 bg-slate-800 text-slate-300 rounded-md text-sm hover:bg-slate-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 10px;
    }
  `]
})
export class OrganizationManagementComponent implements OnInit {
    organizations: Organization[] = [];
    isLoading = false;
    isSaving = false;
    isLoadingPermissions = false;
    isLoadingDetails = false;

    // Modal state
    isCreateAdminModalOpen = false;
    isCreateOrganizationModalOpen = false;
    isViewDetailsModalOpen = false;
    isPermissionsModalOpen = false;
    selectedOrg: Organization | null = null;
    organizationDetails: Organization | null = null;
    adminPermissions: OrganizationAdminPermissions | null = null;

    // Form data
    adminFormData: CreateAdminUserInput = {
        organizationId: 0,
        email: '',
        password: '',
        name: ''
    };

    orgFormData: CreateOrganizationInput = {
        name: '',
        nameAr: '',
        industry: '',
        industryAr: '',
        size: '',
        sizeAr: '',
        email: '',
        phone: '',
        website: '',
        country: '',
        countryAr: '',
        city: '',
        cityAr: '',
        state: '',
        stateAr: '',
        address: '',
        addressAr: '',
        postalCode: '',
        description: '',
        descriptionAr: '',
        timezone: 'UTC',
        taxId: '',
        registrationNumber: '',
        foundedYear: undefined
    };

    errorMessage = '';

    // Permissions
    canManage = false;

    constructor(
        private readonly organizationService: OrganizationService,
        private readonly permissionService: PermissionService,
        public readonly translationService: TranslationService
    ) { }

    ngOnInit(): void {
        this.checkPermissions();
        // Always try to load organizations - API will handle permission check
        this.loadOrganizations();
    }

    checkPermissions(): void {
        // Only super_admin can manage organizations
        this.canManage = this.permissionService.hasPermission(PERMISSIONS.MANAGE_ORGANIZATIONS);
    }

    loadOrganizations(): void {
        this.isLoading = true;
        console.log('Loading organizations...'); // Debug log
        this.organizationService.getAllOrganizations().subscribe({
            next: (orgs) => {
                console.log('Organizations loaded:', orgs); // Debug log
                this.organizations = orgs || [];
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading organizations', err);
                this.isLoading = false;
                const errorMsg = err.error?.error || err.error?.message || 'Failed to load organizations';
                alert(errorMsg);
            }
        });
    }

    openCreateAdminModal(org: Organization): void {
        this.selectedOrg = org;
        this.adminFormData = {
            organizationId: org.id,
            email: '',
            password: '',
            name: ''
        };
        this.isCreateAdminModalOpen = true;
    }

    closeCreateAdminModal(): void {
        this.isCreateAdminModalOpen = false;
        this.selectedOrg = null;
        this.adminFormData = {
            organizationId: 0,
            email: '',
            password: '',
            name: ''
        };
    }

    isAdminFormValid(): boolean {
        return !!(this.adminFormData.name && 
                 this.adminFormData.email && 
                 this.adminFormData.password &&
                 this.adminFormData.password.length >= 6);
    }

    createAdminUser(): void {
        if (!this.isAdminFormValid()) return;

        this.isSaving = true;
        this.organizationService.createAdminUser(this.adminFormData).subscribe({
            next: (response: any) => {
                this.isSaving = false;
                this.closeCreateAdminModal();
                this.loadOrganizations();
                const message = response?.message || 'Admin user created successfully!';
                alert(message);
            },
            error: (err) => {
                console.error('Error creating admin user', err);
                this.isSaving = false;
                const errorMsg = err.error?.error || err.error?.message || 'Failed to create admin user';
                alert(errorMsg);
            }
        });
    }

    viewPermissions(org: Organization): void {
        if (!org.adminId) {
            alert('No admin user found for this organization');
            return;
        }

        this.selectedOrg = org;
        this.isLoadingPermissions = true;
        this.isPermissionsModalOpen = true;
        this.adminPermissions = null;

        this.organizationService.getOrganizationAdminPermissions(org.id).subscribe({
            next: (permissions) => {
                this.adminPermissions = permissions;
                this.isLoadingPermissions = false;
            },
            error: (err) => {
                console.error('Error loading permissions', err);
                this.isLoadingPermissions = false;
                const errorMsg = err.error?.error || err.error?.message || 'Failed to load permissions';
                alert(errorMsg);
            }
        });
    }

    closePermissionsModal(): void {
        this.isPermissionsModalOpen = false;
        this.selectedOrg = null;
        this.adminPermissions = null;
    }

    openCreateOrganizationModal(): void {
        this.orgFormData = {
            name: '',
            nameAr: '',
            industry: '',
            industryAr: '',
            size: '',
            sizeAr: '',
            email: '',
            phone: '',
            website: '',
            country: '',
            countryAr: '',
            city: '',
            cityAr: '',
            state: '',
            stateAr: '',
            address: '',
            addressAr: '',
            postalCode: '',
            description: '',
            descriptionAr: '',
            timezone: 'UTC',
            taxId: '',
            registrationNumber: '',
            foundedYear: undefined
        };
        this.errorMessage = '';
        this.isCreateOrganizationModalOpen = true;
    }

    closeCreateOrganizationModal(): void {
        this.isCreateOrganizationModalOpen = false;
        this.orgFormData = {
            name: '',
            nameAr: '',
            industry: '',
            industryAr: '',
            size: '',
            sizeAr: '',
            email: '',
            phone: '',
            website: '',
            country: '',
            countryAr: '',
            city: '',
            cityAr: '',
            state: '',
            stateAr: '',
            address: '',
            addressAr: '',
            postalCode: '',
            description: '',
            descriptionAr: '',
            timezone: 'UTC',
            taxId: '',
            registrationNumber: '',
            foundedYear: undefined
        };
        this.errorMessage = '';
    }

    isOrgFormValid(): boolean {
        return !!(this.orgFormData.name && this.orgFormData.industry);
    }

    createOrganization(): void {
        if (!this.isOrgFormValid()) return;

        this.isSaving = true;
        this.errorMessage = '';

        this.organizationService.createOrganization(this.orgFormData).subscribe({
            next: (response: any) => {
                this.isSaving = false;
                this.closeCreateOrganizationModal();
                this.loadOrganizations();
                // Show success message
                const message = response?.message || 'Organization created successfully!';
                alert(message);
            },
            error: (err) => {
                console.error('Error creating organization', err);
                this.isSaving = false;
                this.errorMessage = err.error?.error || err.error?.message || 'Failed to create organization';
            }
        });
    }

    viewOrganizationDetails(org: Organization): void {
        this.selectedOrg = org;
        this.isLoadingDetails = true;
        this.isViewDetailsModalOpen = true;
        this.organizationDetails = null;

        this.organizationService.getOrganizationById(org.id).subscribe({
            next: (details) => {
                this.organizationDetails = details;
                this.isLoadingDetails = false;
            },
            error: (err) => {
                console.error('Error loading organization details', err);
                this.isLoadingDetails = false;
                const errorMsg = err.error?.error || err.error?.message || 'Failed to load organization details';
                alert(errorMsg);
            }
        });
    }

    closeViewDetailsModal(): void {
        this.isViewDetailsModalOpen = false;
        this.selectedOrg = null;
        this.organizationDetails = null;
    }
}

