// src/app/components/settings/business-profile/business-profile.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService, Organization } from '../../../services/organization.service';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
    selector: 'app-business-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    template: `
    <div class="p-8 h-full overflow-y-auto">
      <!-- Header -->
      <div class="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-white mb-2">{{ 'organization.businessInfo' | translate }}</h1>
          <p class="text-slate-400 text-sm">{{ 'organization.profileDesc' | translate }}</p>
        </div>
        <button
          *ngIf="organizationInfo"
          (click)="openEditModal()"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-700"
        >
          {{ 'common.editProfile' | translate }}
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>

      <!-- Business Information -->
      <div *ngIf="!isLoading && organizationInfo" class="space-y-6">
        <!-- Basic Information Card -->
        <div class="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {{ 'organization.basicInfo' | translate }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.name' | translate }}</label>
              <p class="text-white text-lg font-medium">{{ organizationInfo.name }}</p>
              <p *ngIf="organizationInfo.nameAr" class="text-slate-400 text-sm mt-0.5" dir="rtl">{{ organizationInfo.nameAr }}</p>
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.industry' | translate }}</label>
              <p class="text-white text-lg font-medium">{{ organizationInfo.industry }}</p>
              <p *ngIf="organizationInfo.industryAr" class="text-slate-400 text-sm mt-0.5" dir="rtl">{{ organizationInfo.industryAr }}</p>
            </div>
            <div *ngIf="organizationInfo.size">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.size' | translate }}</label>
              <p class="text-white text-lg font-medium">{{ organizationInfo.size }}</p>
              <p *ngIf="organizationInfo.sizeAr" class="text-slate-400 text-sm mt-0.5" dir="rtl">{{ organizationInfo.sizeAr }}</p>
            </div>
            <div *ngIf="organizationInfo.foundedYear">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.foundedYear' | translate }}</label>
              <p class="text-white text-lg font-medium">{{ organizationInfo.foundedYear }}</p>
            </div>
            <div *ngIf="organizationInfo.description" class="md:col-span-2">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.description' | translate }}</label>
              <p class="text-white">{{ organizationInfo.description }}</p>
              <p *ngIf="organizationInfo.descriptionAr" class="text-slate-400 text-sm mt-1" dir="rtl">{{ organizationInfo.descriptionAr }}</p>
            </div>
          </div>
        </div>

        <!-- Contact Information Card -->
        <div class="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {{ 'organization.contactInfo' | translate }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div *ngIf="organizationInfo.email">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.email' | translate }}</label>
              <a [href]="'mailto:' + organizationInfo.email" class="text-emerald-400 hover:text-emerald-300 text-lg font-medium">{{ organizationInfo.email }}</a>
            </div>
            <div *ngIf="organizationInfo.phone">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.phone' | translate }}</label>
              <a [href]="'tel:' + organizationInfo.phone" class="text-emerald-400 hover:text-emerald-300 text-lg font-medium">{{ organizationInfo.phone }}</a>
            </div>
            <div *ngIf="organizationInfo.website" class="md:col-span-2">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.website' | translate }}</label>
              <a [href]="organizationInfo.website" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 text-lg font-medium">{{ organizationInfo.website }}</a>
            </div>
          </div>
        </div>

        <!-- Address Information Card -->
        <div class="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ 'organization.addressInfo' | translate }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div *ngIf="organizationInfo.address" class="md:col-span-2">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.address' | translate }}</label>
              <p class="text-white text-lg">{{ organizationInfo.address }}</p>
              <p *ngIf="organizationInfo.addressAr" class="text-slate-400 text-sm mt-0.5" dir="rtl">{{ organizationInfo.addressAr }}</p>
            </div>
            <div *ngIf="organizationInfo.city">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.city' | translate }}</label>
              <p class="text-white text-lg">{{ organizationInfo.city }}</p>
              <p *ngIf="organizationInfo.cityAr" class="text-slate-400 text-sm mt-0.5" dir="rtl">{{ organizationInfo.cityAr }}</p>
            </div>
            <div *ngIf="organizationInfo.state">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.state' | translate }}</label>
              <p class="text-white text-lg">{{ organizationInfo.state }}</p>
              <p *ngIf="organizationInfo.stateAr" class="text-slate-400 text-sm mt-0.5" dir="rtl">{{ organizationInfo.stateAr }}</p>
            </div>
            <div *ngIf="organizationInfo.country">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.country' | translate }}</label>
              <p class="text-white text-lg">{{ organizationInfo.country }}</p>
              <p *ngIf="organizationInfo.countryAr" class="text-slate-400 text-sm mt-0.5" dir="rtl">{{ organizationInfo.countryAr }}</p>
            </div>
            <div *ngIf="organizationInfo.postalCode">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.postalCode' | translate }}</label>
              <p class="text-white text-lg">{{ organizationInfo.postalCode }}</p>
            </div>
            <div *ngIf="organizationInfo.timezone">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.timezone' | translate }}</label>
              <p class="text-white text-lg">{{ organizationInfo.timezone }}</p>
            </div>
          </div>
        </div>

        <!-- Legal & Registration Information Card -->
        <div class="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {{ 'organization.legalInfo' | translate }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div *ngIf="organizationInfo.taxId">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.taxId' | translate }}</label>
              <p class="text-white text-lg font-mono">{{ organizationInfo.taxId }}</p>
            </div>
            <div *ngIf="organizationInfo.registrationNumber">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.registrationNumber' | translate }}</label>
              <p class="text-white text-lg font-mono">{{ organizationInfo.registrationNumber }}</p>
            </div>
          </div>
        </div>

        <!-- Statistics Card -->
        <div class="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {{ 'organization.statistics' | translate }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-[#0f172a] rounded-lg p-4 border border-[#334155]">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-2 block">{{ 'organization.users' | translate }}</label>
              <p class="text-3xl font-bold text-emerald-400">{{ organizationInfo.userCount || 0 }}</p>
            </div>
            <div class="bg-[#0f172a] rounded-lg p-4 border border-[#334155]">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-2 block">{{ 'organization.teams' | translate }}</label>
              <p class="text-3xl font-bold text-emerald-400">{{ organizationInfo.teamCount || 0 }}</p>
            </div>
            <div class="bg-[#0f172a] rounded-lg p-4 border border-[#334155]">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-2 block">{{ 'organization.calls' | translate }}</label>
              <p class="text-3xl font-bold text-emerald-400">{{ organizationInfo.callCount || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Account Information Card -->
        <div class="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ 'organization.accountInfo' | translate }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div *ngIf="organizationInfo.adminName">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.adminName' | translate }}</label>
              <p class="text-white text-lg">{{ organizationInfo.adminName }}</p>
            </div>
            <div *ngIf="organizationInfo.adminEmail">
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.adminEmail' | translate }}</label>
              <a [href]="'mailto:' + organizationInfo.adminEmail" class="text-emerald-400 hover:text-emerald-300 text-lg">{{ organizationInfo.adminEmail }}</a>
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.createdAt' | translate }}</label>
              <p class="text-white text-lg">{{ organizationInfo.createdAt | date:'medium' }}</p>
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-500 uppercase mb-1 block">{{ 'organization.updatedAt' | translate }}</label>
              <p class="text-white text-lg">{{ organizationInfo.updatedAt | date:'medium' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !organizationInfo" class="text-center py-20">
        <p class="text-slate-500 text-lg">{{ 'organization.noInfo' | translate }}</p>
      </div>

      <div *ngIf="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" (click)="closeEditModal()"></div>
        <div class="relative w-full max-w-2xl bg-[#1e293b] border border-[#334155] rounded-xl p-6 max-h-[90vh] overflow-y-auto"
             [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
          <h3 class="text-white font-bold text-xl mb-4">Update Organization Profile</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-slate-400 uppercase block mb-1">Name</label>
              <input [(ngModel)]="editForm.name" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label class="text-xs text-slate-400 uppercase block mb-1">Name (Arabic)</label>
              <input [(ngModel)]="editForm.nameAr" dir="auto" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label class="text-xs text-slate-400 uppercase block mb-1">Industry</label>
              <input [(ngModel)]="editForm.industry" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label class="text-xs text-slate-400 uppercase block mb-1">Industry (Arabic)</label>
              <input [(ngModel)]="editForm.industryAr" dir="auto" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label class="text-xs text-slate-400 uppercase block mb-1">Email</label>
              <input [(ngModel)]="editForm.email" type="email" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label class="text-xs text-slate-400 uppercase block mb-1">Phone</label>
              <input [(ngModel)]="editForm.phone" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white" />
            </div>
            <div class="md:col-span-2">
              <label class="text-xs text-slate-400 uppercase block mb-1">Website</label>
              <input [(ngModel)]="editForm.website" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white" />
            </div>
            <div class="md:col-span-2">
              <label class="text-xs text-slate-400 uppercase block mb-1">Address</label>
              <input [(ngModel)]="editForm.address" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label class="text-xs text-slate-400 uppercase block mb-1">City</label>
              <input [(ngModel)]="editForm.city" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label class="text-xs text-slate-400 uppercase block mb-1">Country</label>
              <input [(ngModel)]="editForm.country" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white" />
            </div>
            <div class="md:col-span-2">
              <label class="text-xs text-slate-400 uppercase block mb-1">Description</label>
              <textarea [(ngModel)]="editForm.description" rows="3" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white"></textarea>
            </div>
          </div>

          <p *ngIf="saveError" class="text-red-400 text-xs mt-3">{{ saveError }}</p>

          <div class="mt-6 flex justify-end gap-3">
            <button (click)="closeEditModal()" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold uppercase">Cancel</button>
            <button
              (click)="saveOrganization()"
              [disabled]="isSaving"
              class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase disabled:opacity-50"
            >
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class BusinessProfileComponent implements OnInit {
    organizationInfo: Organization | null = null;
    isLoading = false;
  isEditModalOpen = false;
  isSaving = false;
  saveError = '';
  editForm: any = {
    name: '',
    nameAr: '',
    industry: '',
    industryAr: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: '',
    description: ''
  };

    constructor(
        private readonly organizationService: OrganizationService,
        private readonly authService: AuthService,
        public readonly translationService: TranslationService
    ) { }

    ngOnInit() {
        this.loadOrganizationInfo();
    }

    loadOrganizationInfo() {
        this.isLoading = true;
        // Use /me endpoint for all authenticated users (automatically gets their organization)
        this.organizationService.getMyOrganization().subscribe({
            next: (org) => {
                this.organizationInfo = org;
            this.editForm = {
              name: org.name || '',
              nameAr: org.nameAr || '',
              industry: org.industry || '',
              industryAr: org.industryAr || '',
              email: org.email || '',
              phone: org.phone || '',
              website: org.website || '',
              address: org.address || '',
              city: org.city || '',
              country: org.country || '',
              description: org.description || ''
            };
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading organization info', err);
                this.isLoading = false;
            }
        });
    }

        openEditModal() {
          if (!this.organizationInfo) return;
          this.saveError = '';
          this.isEditModalOpen = true;
        }

        closeEditModal() {
          this.isEditModalOpen = false;
          this.saveError = '';
        }

        saveOrganization() {
          if (this.isSaving) return;

          this.isSaving = true;
          this.saveError = '';

          this.organizationService.updateMyOrganization(this.editForm).subscribe({
            next: (res: any) => {
              this.organizationInfo = res?.organization || this.organizationInfo;
              this.isSaving = false;
              this.closeEditModal();
            },
            error: (err) => {
              this.saveError = err?.error?.error || 'Failed to update organization profile';
              this.isSaving = false;
            }
          });
        }
}

