import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  template: `
    <div class="min-h-screen bg-[#0b1b1b] flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600/20 text-teal-500 mb-4 border border-teal-500/20 shadow-lg shadow-teal-500/10">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-white tracking-tight">{{ 'auth.createAccount' | translate }}</h1>
          <p class="text-slate-400 mt-2">{{ 'auth.getStarted' | translate }}</p>
        </div>

        <div class="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-600 to-emerald-600"></div>

          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{{ 'auth.name' | translate }}</label>
              <input
                type="text"
                [(ngModel)]="name"
                name="name"
                required
                dir="auto"
                class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="John Doe"
              >
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{{ 'auth.name' | translate }} (Arabic) <span class="text-slate-500 text-[10px] normal-case">({{ 'common.optional' | translate }})</span></label>
              <input
                type="text"
                [(ngModel)]="nameAr"
                name="nameAr"
                dir="auto"
                class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                [placeholder]="'auth.nameArPlaceholder' | translate"
              >
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{{ 'auth.email' | translate }}</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="you@example.com"
              >
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{{ 'auth.password' | translate }}</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="••••••••"
              >
            </div>

            <div *ngIf="errorMessage" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm italic">
                {{ errorMessage }}
            </div>

            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-teal-900/40 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span *ngIf="!isLoading">{{ 'auth.signUp' | translate }}</span>
              <span *ngIf="isLoading" class="flex items-center gap-2">
                 <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r=10 stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ 'auth.processing' | translate }}
              </span>
              <svg *ngIf="!isLoading" class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </button>
          </form>

          <p class="text-center mt-6 text-sm text-slate-400">
            {{ 'auth.alreadyHaveAccount' | translate }}
            <a routerLink="/login" class="text-teal-500 hover:text-teal-400 font-semibold transition-colors">{{ 'auth.signIn' | translate }}</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  name = '';
  nameAr = '';
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly translationService: TranslationService
  ) { }

  onSubmit(): void {
    if (!this.email || !this.password || !this.name) return;
    this.isLoading = true;
    this.errorMessage = '';

    const currentLanguage = this.translationService.getCurrentLanguage();
    this.authService.register({
      name: this.name,
      nameAr: this.nameAr || undefined,
      email: this.email,
      password: this.password,
      language: currentLanguage
    }).subscribe({
      next: (response) => {
        // Sync language preference from user
        if (response.user?.language && ['en', 'ar', 'fr'].includes(response.user.language)) {
          this.translationService.setLanguage(response.user.language as 'en' | 'ar' | 'fr');
        }

        // Check user role and organization status to determine redirect
        const user = response.user || this.authService.getUser();

        if (!user) {
          this.router.navigate(['/onboarding']);
          return;
        }

        // Get role name
        let roleName = '';
        if (user.role) {
          if (typeof user.role === 'string') {
            roleName = user.role;
          } else if (typeof user.role === 'object' && 'name' in user.role) {
            roleName = (user.role as { name?: string }).name || '';
          }
        }

        const roleNameLower = roleName?.toLowerCase() || '';
        const isSuperAdmin = roleName === 'super_admin' ||
                            roleNameLower === 'super_admin' ||
                            roleName === 'Super Admin' || // Legacy support
                            roleNameLower === 'super admin' ||
                            roleNameLower === 'superadmin';

        // Super Admin always goes to dashboard
        if (isSuperAdmin) {
          this.router.navigate(['/sales']);
          return;
        }

        // New registered users don't have organization - go to onboarding
        if (user.organizationId) {
          // User has organization - go to dashboard
          this.router.navigate(['/sales']);
        } else {
          // User has no organization - go to onboarding
          this.router.navigate(['/onboarding']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Registration failed';
      }
    });
  }
}
