// src/app/components/shared/language-switcher/language-switcher.ts
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Language } from '../../../services/translation.service';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full language-switcher-container">
      <button 
        (click)="toggleDropdown($event)"
        type="button"
        class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 border border-slate-600 text-white text-xs transition-colors"
      >
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
          </svg>
          <span class="truncate">{{ getCurrentLanguageName() }}</span>
        </div>
        <svg class="w-3 h-3 flex-shrink-0 transition-transform" [class.rotate-180]="isDropdownOpen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      
      <div 
        *ngIf="isDropdownOpen"
        class="absolute top-full mt-2 left-0 right-0 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden"
      >
        <button
          *ngFor="let lang of languages"
          type="button"
          (click)="selectLanguage(lang.code, $event)"
          [class.bg-emerald-600]="translationService.getCurrentLanguage() === lang.code"
          [class.text-white]="translationService.getCurrentLanguage() === lang.code"
          [class.text-slate-300]="translationService.getCurrentLanguage() !== lang.code"
          class="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <span class="text-base">{{ lang.flag }}</span>
          <span class="font-medium">{{ lang.name }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class LanguageSwitcherComponent {
  isDropdownOpen = false;
  
  languages = [
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
    { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' },
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' }
  ];

  constructor(
    public translationService: TranslationService,
    private readonly authService: AuthService,
    private readonly apiService: ApiService
  ) {}

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.isDropdownOpen && !target.closest('.language-switcher-container')) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectLanguage(lang: Language, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.translationService.setLanguage(lang);
    this.isDropdownOpen = false;
    
    // Update language preference in backend if user is logged in
    const user = this.authService.getUser();
    if (user?.id) {
      this.apiService.put('auth/user/language', { language: lang }).subscribe({
        next: () => {
          // Update local user object
          const updatedUser = { ...user, language: lang };
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        },
        error: (err: any) => {
          console.error('Failed to update language preference:', err);
        }
      });
    }
  }

  getCurrentLanguageName(): string {
    const current = this.translationService.getCurrentLanguage();
    const lang = this.languages.find(l => l.code === current);
    return lang ? lang.name : 'English';
  }
}

