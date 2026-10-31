import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Fix: Import FormsModule
import { Router } from '@angular/router';
import { OnboardingService } from '../../../services/onboarding.service';
import { AuthService } from '../../../services/auth.service';

import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
    selector: 'app-onboarding-wizard',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    template: `
    <div class="min-h-screen bg-[#0f172a] flex items-center justify-center p-4"
         [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      <div class="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">

        <!-- Progress Bar -->
        <div class="h-1 bg-[#334155]">
            <div class="h-full bg-emerald-500 transition-all duration-500" [style.width.%]="(step / 3) * 100"></div>
        </div>

        <div class="p-8">
            <!-- Header -->
            <div class="mb-8 text-center">
                <h1 class="text-2xl font-bold text-white mb-2">{{ 'onboarding.welcome' | translate }}</h1>
                <p class="text-slate-400">{{ 'onboarding.setupDescription' | translate }}</p>
            </div>

            <!-- Step 1: Business Profile -->
            <div *ngIf="step === 1" class="space-y-6">
                <h2 class="text-lg font-semibold text-emerald-400" [class.text-right]="translationService.isRTL()">{{ 'onboarding.step1Title' | translate }}</h2>

                <div [class.text-right]="translationService.isRTL()">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ 'onboarding.organizationName' | translate }} *</label>
                    <input [(ngModel)]="formData.organizationName" [placeholder]="'onboarding.organizationName' | translate" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors">
                    <label class="block text-xs text-slate-500 mt-1 mb-1">{{ 'onboarding.organizationNameAr' | translate }}</label>
                    <input [(ngModel)]="formData.organizationNameAr" dir="auto" [placeholder]="'onboarding.organizationNameArPlaceholder' | translate" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none text-sm">
                </div>

                <div class="grid grid-cols-2 gap-4" [class.flex-row-reverse]="translationService.isRTL()">
                    <div [class.text-right]="translationService.isRTL()">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ 'onboarding.industry' | translate }} *</label>
                        <select [(ngModel)]="formData.industry" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none">
                            <option value="">{{ 'onboarding.selectIndustry' | translate }}</option>
                            <option value="Insurance">{{ 'onboarding.industries.insurance' | translate }}</option>
                            <option value="Banking">{{ 'onboarding.industries.banking' | translate }}</option>
                            <option value="Retail">{{ 'onboarding.industries.retail' | translate }}</option>
                            <option value="Healthcare">{{ 'onboarding.industries.healthcare' | translate }}</option>
                            <option value="Technology">{{ 'onboarding.industries.technology' | translate }}</option>
                            <option value="Finance">{{ 'onboarding.industries.finance' | translate }}</option>
                            <option value="Real Estate">{{ 'onboarding.industries.realEstate' | translate }}</option>
                            <option value="Education">{{ 'onboarding.industries.education' | translate }}</option>
                            <option value="Telecommunications">{{ 'onboarding.industries.telecommunications' | translate }}</option>
                            <option value="Other">{{ 'onboarding.industries.other' | translate }}</option>
                        </select>
                        <input [(ngModel)]="formData.industryAr" dir="auto" [placeholder]="'onboarding.industryAr' | translate" class="w-full mt-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white text-sm outline-none">
                    </div>
                    <div [class.text-right]="translationService.isRTL()">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ 'onboarding.companySize' | translate }}</label>
                        <select [(ngModel)]="formData.size" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none">
                            <option value="1-10">{{ 'onboarding.sizes.1_10' | translate }}</option>
                            <option value="11-50">{{ 'onboarding.sizes.11_50' | translate }}</option>
                            <option value="51-200">{{ 'onboarding.sizes.51_200' | translate }}</option>
                            <option value="201-500">{{ 'onboarding.sizes.201_500' | translate }}</option>
                            <option value="501-1000">{{ 'onboarding.sizes.501_1000' | translate }}</option>
                            <option value="1000+">{{ 'onboarding.sizes.1000_plus' | translate }}</option>
                        </select>
                        <input [(ngModel)]="formData.sizeAr" dir="auto" [placeholder]="'onboarding.sizeAr' | translate" class="w-full mt-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white text-sm outline-none">
                    </div>
                </div>

                <div [class.text-right]="translationService.isRTL()">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ 'onboarding.businessEmail' | translate }}</label>
                    <input type="email" [(ngModel)]="formData.email" placeholder="contact@company.com" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors">
                </div>

                <div [class.text-right]="translationService.isRTL()">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ 'onboarding.phoneNumber' | translate }}</label>
                    <input type="tel" [(ngModel)]="formData.phone" placeholder="+1 (555) 123-4567" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors">
                </div>

                <div [class.text-right]="translationService.isRTL()">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ 'onboarding.website' | translate }}</label>
                    <input type="url" [(ngModel)]="formData.website" placeholder="https://www.company.com" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors">
                </div>

                <div class="grid grid-cols-2 gap-4" [class.flex-row-reverse]="translationService.isRTL()">
                    <div [class.text-right]="translationService.isRTL()">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ 'onboarding.country' | translate }}</label>
                        <input [(ngModel)]="formData.country" placeholder="United States" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors">
                        <input [(ngModel)]="formData.countryAr" dir="auto" [placeholder]="'onboarding.countryAr' | translate" class="w-full mt-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white text-sm outline-none">
                    </div>
                    <div [class.text-right]="translationService.isRTL()">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ 'onboarding.city' | translate }}</label>
                        <input [(ngModel)]="formData.city" placeholder="New York" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors">
                        <input [(ngModel)]="formData.cityAr" dir="auto" [placeholder]="'onboarding.cityAr' | translate" class="w-full mt-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white text-sm outline-none">
                    </div>
                </div>

                <div [class.text-right]="translationService.isRTL()">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ 'onboarding.description' | translate }}</label>
                    <textarea [(ngModel)]="formData.description" rows="3" placeholder="Brief description of your business..." class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors resize-none"></textarea>
                    <label class="block text-xs text-slate-500 mt-1 mb-1">{{ 'onboarding.descriptionAr' | translate }}</label>
                    <textarea [(ngModel)]="formData.descriptionAr" dir="auto" rows="2" [placeholder]="'onboarding.descriptionArPlaceholder' | translate" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white text-sm outline-none resize-none"></textarea>
                </div>

                <div class="flex justify-end pt-4" [class.flex-row-reverse]="translationService.isRTL()">
                    <button (click)="nextStep()" [disabled]="!formData.organizationName || !formData.industry" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ 'onboarding.nextTeams' | translate }}
                    </button>
                </div>
            </div>

            <!-- Step 2: Teams -->
            <div *ngIf="step === 2" class="space-y-6">
                <h2 class="text-lg font-semibold text-emerald-400" [class.text-right]="translationService.isRTL()">{{ 'onboarding.step2Title' | translate }}</h2>
                <p class="text-sm text-slate-400 mb-4" [class.text-right]="translationService.isRTL()">{{ 'onboarding.step2Description' | translate }}</p>

                <div class="space-y-3">
                    <div *ngFor="let team of formData.teams; let i = index" class="flex gap-2" [class.flex-row-reverse]="translationService.isRTL()">
                        <input [(ngModel)]="formData.teams[i]" [placeholder]="'team.teamName' | translate" class="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none" [class.text-right]="translationService.isRTL()">
                        <button *ngIf="formData.teams.length > 1" (click)="removeTeam(i)" class="text-red-400 hover:text-red-300 px-2">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                <button (click)="addTeam()" class="text-emerald-500 hover:text-emerald-400 text-sm font-bold flex items-center gap-1 mt-2" [class.flex-row-reverse]="translationService.isRTL()">
                    {{ 'onboarding.addAnotherTeam' | translate }}
                </button>

                <div class="flex justify-between pt-6 border-t border-[#334155] mt-6" [class.flex-row-reverse]="translationService.isRTL()">
                    <button (click)="step = 1" class="text-slate-400 hover:text-white font-medium">{{ 'onboarding.back' | translate }}</button>
                    <button (click)="nextStep()" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-all">
                        {{ 'onboarding.nextReview' | translate }}
                    </button>
                </div>
            </div>

            <!-- Step 3: Review & Finish -->
            <div *ngIf="step === 3" class="space-y-6">
                <h2 class="text-lg font-semibold text-emerald-400" [class.text-right]="translationService.isRTL()">{{ 'onboarding.step3Title' | translate }}</h2>

                <div class="bg-[#0f172a] rounded-xl p-6 border border-[#334155] space-y-4" [class.text-right]="translationService.isRTL()">
                    <div>
                        <p class="text-xs text-slate-500 uppercase font-bold">{{ 'onboarding.reviewOrg' | translate }}</p>
                        <p class="text-white text-lg font-medium">{{ formData.organizationName }}</p>
                        <p *ngIf="formData.organizationNameAr" class="text-sm text-slate-400" dir="rtl">{{ formData.organizationNameAr }}</p>
                        <p class="text-sm text-slate-400">
                          {{ formData.industry }}<span *ngIf="formData.industryAr"> / <span dir="rtl">{{ formData.industryAr }}</span></span> •
                          {{ formData.size }}<span *ngIf="formData.sizeAr"> / <span dir="rtl">{{ formData.sizeAr }}</span></span>
                        </p>
                        <p class="text-xs text-slate-500 mt-2" *ngIf="formData.email">{{ formData.email }}</p>
                        <p class="text-xs text-slate-500" *ngIf="formData.city || formData.country">{{ formData.city }}<span *ngIf="formData.city && formData.country">, </span>{{ formData.country }}<span *ngIf="formData.cityAr || formData.countryAr"> (AR: <span dir="rtl">{{ formData.cityAr }}<span *ngIf="formData.cityAr && formData.countryAr">, </span>{{ formData.countryAr }}</span>)</span></p>
                    </div>
                    <div>
                         <p class="text-xs text-slate-500 uppercase font-bold mb-2">{{ 'onboarding.reviewTeams' | translate }}</p>
                         <div class="flex flex-wrap gap-2" [class.flex-row-reverse]="translationService.isRTL()">
                            <span *ngFor="let team of formData.teams" class="bg-[#1e293b] border border-[#334155] px-3 py-1 rounded-full text-xs text-slate-300 font-medium">
                                {{ team }}
                            </span>
                         </div>
                    </div>
                </div>

                <div class="flex justify-between pt-6" [class.flex-row-reverse]="translationService.isRTL()">
                    <button (click)="step = 2" class="text-slate-400 hover:text-white font-medium">{{ 'onboarding.back' | translate }}</button>
                    <button (click)="finish()" [disabled]="isLoading" class="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-500 hover:to-teal-500 font-bold shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2">
                        <span *ngIf="isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        {{ (isLoading ? 'onboarding.settingUp' : 'onboarding.completeSetup') | translate }}
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  `
})
export class OnboardingWizardComponent implements OnInit {
    step = 1;
    isLoading = false;
    formData = {
        organizationName: '',
        organizationNameAr: '',
        industry: '',
        industryAr: '',
        size: '1-10',
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
        description: '',
        descriptionAr: '',
        teams: ['Sales Team', 'Support Team']
    };

    constructor(
        private onboardingService: OnboardingService,
        private router: Router,
        private authService: AuthService,
        public readonly translationService: TranslationService
    ) { }

    ngOnInit() {
        // Check if user is Super Admin and redirect immediately
        this.checkSuperAdmin();
    }

    private checkSuperAdmin() {
        const user = this.authService.getUser();
        if (user) {
            const roleName = typeof user?.role === 'string' ? user.role : (user?.role as any)?.name;
            const roleNameLower = roleName?.toLowerCase() || '';
            const isSuperAdmin = roleName === 'super_admin' ||
                                roleNameLower === 'super_admin' ||
                                roleName === 'Super Admin' || // Legacy support
                                roleNameLower === 'super admin' ||
                                roleNameLower === 'superadmin' ||
                                user?.email?.toLowerCase() === 'superadmin@securosense.com';

            if (isSuperAdmin) {
                // Super Admin should not see onboarding - redirect to dashboard
                this.router.navigate(['/sales']);
            }
        }
    }

    addTeam() {
        this.formData.teams.push('');
    }

    removeTeam(index: number) {
        this.formData.teams.splice(index, 1);
    }

    nextStep() {
        if (this.step === 2) {
            // Filter empty team names
            this.formData.teams = this.formData.teams.filter(t => t.trim() !== '');
            if (this.formData.teams.length === 0) this.formData.teams.push('General Team');
        }
        this.step++;
    }

    finish() {
        this.isLoading = true;
        this.onboardingService.setup(this.formData).subscribe({
            next: () => {
                this.router.navigate(['/sales']); // Redirect to dashboard
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
                alert('Setup failed. Please try again.');
            }
        });
    }
}
