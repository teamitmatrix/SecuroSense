// src/app/services/translation.service.ts
import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

export type Language = 'en' | 'ar' | 'fr';

export interface Translations {
  [key: string]: string | Translations;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations: Translations = {};
  public currentLanguage = signal<Language>('en');

  // RTL languages
  private rtlLanguages: Language[] = ['ar'];

  constructor(private http: HttpClient) {
    // Load saved language preference
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && ['en', 'ar', 'fr'].includes(savedLang)) {
      this.currentLanguage.set(savedLang);
    }

    // Load translations on initialization
    this.loadTranslations(this.currentLanguage());

    // Watch for language changes and reload translations
    effect(() => {
      const lang = this.currentLanguage();
      this.loadTranslations(lang);
      this.updateDocumentDirection();
    });
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage();
  }

  isRTL(): boolean {
    return this.rtlLanguages.includes(this.currentLanguage());
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
    localStorage.setItem('app_language', lang);
  }

  private updateDocumentDirection(): void {
    if (this.isRTL()) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      const lang = this.currentLanguage();
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', lang);
    }
  }

  private loadTranslations(lang: Language): void {
    this.http.get<Translations>(`/assets/i18n/${lang}.json`)
      .pipe(
        catchError(() => {
          // Fallback to English if translation file not found
          console.warn(`Translation file for ${lang} not found, falling back to English`);
          return this.http.get<Translations>('/assets/i18n/en.json');
        })
      )
      .subscribe({
        next: (translations) => {
          this.translations = translations;
        },
        error: (err) => {
          console.error('Failed to load translations:', err);
          // Use empty translations as fallback
          this.translations = {};
        }
      });
  }

  translate(key: string, params?: { [key: string]: any }): string {
    if (!key) return '';

    const keys = key.split('.');
    let value: any = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      Object.keys(params).forEach(paramKey => {
        // Handle optional spaces around the parameter name
        value = value.replace(new RegExp(`\\{\\{\\s*${paramKey}\\s*\\}\\}`, 'g'), String(params[paramKey]));
      });
    }

    return value;
  }

  // Shorthand method
  t(key: string, params?: { [key: string]: any }): string {
    return this.translate(key, params);
  }
}

