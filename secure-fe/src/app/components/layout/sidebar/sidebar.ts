import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, LanguageSwitcherComponent, TranslatePipe],
  template: `
    <!-- Mobile Backdrop -->
    <div *ngIf="isOpen" 
         class="fixed inset-0 bg-black/50 z-40 lg:hidden"
         (click)="sidebarClose.emit()">
    </div>

    <aside class="fixed inset-y-0 z-50 w-64 bg-[#1e293b] text-slate-300 flex flex-col h-full transform transition-transform duration-300 sidebar-container"
           [class.left-0]="!translationService.isRTL()"
           [class.right-0]="translationService.isRTL()"
           [class.lg:relative]="true"
           [class.lg:translate-x-0]="true"
           [class.border-r]="!translationService.isRTL()"
           [class.border-l]="translationService.isRTL()"
           [class.border-[#334155]]="true"
           [class.-translate-x-full]="!isOpen && !translationService.isRTL()"
           [class.translate-x-full]="!isOpen && translationService.isRTL()"
           [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      <!-- Brand -->
      <div class="p-6 flex flex-col items-center border-b border-[#334155]">
        <div class="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-2 shadow-lg shadow-emerald-500/20">
          S
        </div>
        <h1 class="text-white text-lg font-bold tracking-tight">SecuroSense</h1>
        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">AI Analytics Engine</p>
        
        <!-- Language Switcher -->
        <div class="w-full">
          <app-language-switcher></app-language-switcher>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <div class="px-4 mb-6">
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4"
             [class.pl-3]="!translationService.isRTL()"
             [class.pr-3]="translationService.isRTL()">{{ 'sidebar.insights' | translate }}</p>
          <a *ngIf="userRole !== 'Agent' && userRole !== 'agent'" routerLink="/sales" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2 group"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <span class="font-medium">{{ 'sidebar.salesDashboard' | translate }}</span>
          </a>
          <a routerLink="/call-analysis" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            <span class="font-medium">{{ 'sidebar.callAnalysis' | translate }}</span>
          </a>
          <a routerLink="/compliance" routerLinkActive="bg-blue-600 text-white shadow-lg shadow-blue-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 5.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            <span class="font-medium">{{ 'sidebar.compliance' | translate }}</span>
          </a>
        </div>

        <div class="px-4 mb-6">
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4"
             [class.pl-3]="!translationService.isRTL()"
             [class.pr-3]="translationService.isRTL()">{{ 'sidebar.workflow' | translate }}</p>
          <a routerLink="/promise-management" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span class="font-medium">{{ 'sidebar.promises' | translate }}</span>
          </a>
        </div>

        <div class="px-4 mb-6" *ngIf="userRole === 'Admin' || userRole === 'super_admin' || userRole === 'Super Admin'">
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4"
             [class.pl-3]="!translationService.isRTL()"
             [class.pr-3]="translationService.isRTL()">{{ 'sidebar.management' | translate }}</p>
          <a routerLink="/settings/teams" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span class="font-medium">{{ 'sidebar.teams' | translate }}</span>
          </a>
          <a routerLink="/settings/agents" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zM19 12a4 4 0 11-8 0 4 4 0 018 0zm2 5h-4a2 2 0 00-2 2v2h8v-2a2 2 0 00-2-2z" /></svg>
            <span class="font-medium">{{ 'sidebar.userMgmt' | translate }}</span>
          </a>
          <a routerLink="/settings/benchmarking" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <span class="font-medium">{{ 'sidebar.benchmarking' | translate }}</span>
          </a>

           <a routerLink="/settings/roles" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span class="font-medium">{{ 'sidebar.roles' | translate }}</span>
          </a>
          <a routerLink="/settings/qa-templates" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2" *ngIf="userRole === 'super_admin' || userRole === 'Super Admin'"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            <span class="font-medium">{{ 'sidebar.qaTemplates' | translate }}</span>
          </a>
          <a routerLink="/settings/qa-parameters" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2" *ngIf="userRole !== 'super_admin' && userRole !== 'Super Admin'"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>
            <span class="font-medium">{{ 'sidebar.qaParameters' | translate }}</span>
          </a>
          <a routerLink="/settings/business-profile" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2" *ngIf="userRole !== 'super_admin' && userRole !== 'Super Admin'"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            <span class="font-medium">{{ 'sidebar.businessProfile' | translate }}</span>
          </a>
        </div>

        <!-- Super Admin Only Section -->
        <div class="px-4 mb-6" *ngIf="userRole === 'super_admin' || userRole === 'Super Admin'">
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4"
             [class.pl-3]="!translationService.isRTL()"
             [class.pr-3]="translationService.isRTL()">{{ 'sidebar.platform' | translate }}</p>
          <a routerLink="/settings/organizations" routerLinkActive="bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#334155] hover:text-white transition-all text-sm mb-2"
             [class.flex-row-reverse]="translationService.isRTL()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            <span class="font-medium">{{ 'sidebar.organizations' | translate }}</span>
          </a>
        </div>
      </nav>

      <!-- User Footer -->
      <div class="p-4 border-t border-[#334155] bg-[#1a2436]">
        <div class="flex items-center gap-3 px-2 mb-4"
             [class.flex-row-reverse]="translationService.isRTL()">
          <div class="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white uppercase">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0"
               [class.text-right]="translationService.isRTL()">
            <p class="text-sm font-bold text-white truncate">{{ userName }}</p>
            <p class="text-[10px] text-slate-500 truncate">{{ userEmail }}</p>
          </div>
        </div>

        <button
          (click)="openProfileModal()"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest border border-emerald-500/20"
          [class.flex-row-reverse]="translationService.isRTL()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5h2m-1-1a4 4 0 00-4 4v1H7a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-1V8a4 4 0 00-4-4z"/></svg>
          {{ 'common.editProfile' | translate }}
        </button>
        
        <button 
          (click)="logout()"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest border border-red-500/20"
          [class.flex-row-reverse]="translationService.isRTL()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          {{ 'common.logout' | translate }}
        </button>
      </div>

      <div *ngIf="isProfileModalOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70" (click)="closeProfileModal()"></div>
        <div class="relative w-full max-w-md bg-[#0f172a] border border-[#334155] rounded-xl p-6 shadow-2xl"
             [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
          <h3 class="text-white font-bold text-lg mb-4">Update Profile</h3>

          <div class="space-y-3">
            <div>
              <label class="block text-[10px] text-slate-500 uppercase font-bold mb-1">Name</label>
              <input [(ngModel)]="profileForm.name" class="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 uppercase font-bold mb-1">Name (Arabic)</label>
              <input [(ngModel)]="profileForm.nameAr" dir="auto" class="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 uppercase font-bold mb-1">Email</label>
              <input type="email" [(ngModel)]="profileForm.email" class="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
            </div>
          </div>

          <p *ngIf="profileError" class="text-red-400 text-xs mt-3">{{ profileError }}</p>

          <div class="mt-5 flex justify-end gap-3">
            <button (click)="closeProfileModal()" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold uppercase">Cancel</button>
            <button
              (click)="saveProfile()"
              [disabled]="isSavingProfile || !isProfileFormValid()"
              class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase disabled:opacity-50"
            >
              {{ isSavingProfile ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Output() sidebarClose = new EventEmitter<void>();

  userName = 'User';
  userEmail = '';
  userInitial = 'U';
  userRole = '';
  isDesktop = false;
  isProfileModalOpen = false;
  isSavingProfile = false;
  profileError = '';
  profileForm = {
    name: '',
    nameAr: '',
    email: ''
  };

  constructor(
    private readonly authService: AuthService, 
    private readonly router: Router,
    public readonly translationService: TranslationService
  ) { }

  ngOnInit() {
    const user: any = this.authService.getUser();
    if (user) {
      this.userName = user.name || 'User';
      this.userEmail = user.email;
      this.userInitial = (user.name || 'U').charAt(0).toUpperCase();
      this.userRole = user.role?.name || user.role || '';
      this.profileForm = {
        name: user.name || '',
        nameAr: user.nameAr || '',
        email: user.email || ''
      };
    }
  }

  openProfileModal() {
    const user: any = this.authService.getUser();
    this.profileError = '';
    this.profileForm = {
      name: user?.name || '',
      nameAr: user?.nameAr || '',
      email: user?.email || ''
    };
    this.isProfileModalOpen = true;
  }

  closeProfileModal() {
    this.isProfileModalOpen = false;
    this.profileError = '';
  }

  isProfileFormValid(): boolean {
    return !!this.profileForm.name?.trim() && !!this.profileForm.email?.trim();
  }

  saveProfile() {
    if (!this.isProfileFormValid() || this.isSavingProfile) {
      return;
    }

    this.isSavingProfile = true;
    this.profileError = '';

    this.authService.updateMyProfile({
      name: this.profileForm.name.trim(),
      nameAr: this.profileForm.nameAr.trim(),
      email: this.profileForm.email.trim()
    }).subscribe({
      next: (res) => {
        const updatedUser = res?.user;
        if (updatedUser) {
          this.userName = updatedUser.name || 'User';
          this.userEmail = updatedUser.email || '';
          this.userInitial = (updatedUser.name || 'U').charAt(0).toUpperCase();
        }
        this.isSavingProfile = false;
        this.closeProfileModal();
      },
      error: (err) => {
        this.profileError = err?.error?.error || 'Failed to update profile';
        this.isSavingProfile = false;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/welcome']);
  }
}
