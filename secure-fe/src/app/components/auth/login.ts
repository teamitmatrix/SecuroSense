import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  template: `
    <div class="min-h-screen bg-[#0b1b1b] flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-500 mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-white tracking-tight">{{ 'common.welcome' | translate }}</h1>
          <p class="text-slate-400 mt-2">{{ 'auth.signIn' | translate }}</p>
        </div>

        <div class="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>

          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{{ 'auth.email' | translate }}</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
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
                class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              >
            </div>

            <div *ngIf="errorMessage" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm italic">
                {{ errorMessage }}
            </div>

            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span *ngIf="!isLoading">{{ 'auth.signIn' | translate }}</span>
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
            {{ 'auth.dontHaveAccount' | translate }}
            <a routerLink="/register" class="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors">{{ 'auth.createAccount' | translate }}</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private translationService: TranslationService
  ) { }

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        // Sync language preference from user
        if (response.user?.language) {
          this.translationService.setLanguage(response.user.language as any);
        }

        // Check user role and organization status to determine redirect
        const user = response.user || this.authService.getUser();

        if (!user) {
          this.router.navigate(['/sales']);
          return;
        }

        // Get role name
        let roleName = '';
        if (user.role) {
          if (typeof user.role === 'string') {
            roleName = user.role;
          } else if (typeof user.role === 'object' && 'name' in user.role) {
            roleName = (user.role as any).name || '';
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

        // For other users: check if they have organization
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
        this.errorMessage = err.error?.error || 'Invalid credentials';
      }
    });
  }
}
