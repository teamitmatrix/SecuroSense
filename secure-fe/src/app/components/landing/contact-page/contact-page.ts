import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';
import {LanguageSwitcherComponent} from '../../shared/language-switcher/language-switcher';
import {RouterLink} from '@angular/router';
import { ContactService } from '../../../services/contact.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LanguageSwitcherComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-[#1e293b] text-white overflow-x-hidden"
         [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">

      <!-- Header -->
      <header class="container mx-auto px-6 py-6 flex justify-between items-center"
              [class.flex-row-reverse]="translationService.isRTL()">
        <a routerLink="/welcome" class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div class="w-10 h-10 bg-[#334155] rounded-lg flex items-center justify-center text-white text-xl font-bold">
            8
          </div>
          <div class="flex flex-col"
               [class.text-right]="translationService.isRTL()">
            <span class="font-bold text-lg leading-tight">SecuroSense</span>
            <span class="text-[10px] text-slate-400 uppercase tracking-widest">{{ 'landing.tagline' | translate }}</span>
          </div>
        </a>

        <nav class="hidden md:flex items-center gap-4 text-sm text-slate-300">
          <a routerLink="/welcome" class="hover:text-white transition-colors">{{ 'landing.overview' | translate }}</a>
          <a routerLink="/features" class="hover:text-white transition-colors">{{ 'landing.featuresNav' | translate }}</a>
          <a routerLink="/performance" class="hover:text-white transition-colors">{{ 'landing.performance' | translate }}</a>
          <a routerLink="/industries" class="hover:text-white transition-colors">{{ 'landing.industries' | translate }}</a>
          <a routerLink="/contact" class="hover:text-white transition-colors">{{ 'landing.contactNav' | translate }}</a>
          <app-language-switcher></app-language-switcher>
          <a routerLink="/login" class="text-slate-300 hover:text-white px-4 py-2 rounded-md font-medium transition-colors">
            {{ 'common.login' | translate }}
          </a>
          <a routerLink="/register" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
            {{ 'common.register' | translate }}
          </a>
        </nav>

        <!-- Mobile Menu -->
        <div class="md:hidden flex items-center gap-6"
             [class.flex-row-reverse]="translationService.isRTL()">
          <nav class="flex items-center gap-3 text-xs text-slate-400">
            <a routerLink="/features" class="hover:text-white">{{ 'landing.featuresNav' | translate }}</a>
            <a routerLink="/performance" class="hover:text-white">{{ 'landing.performance' | translate }}</a>
            <a routerLink="/industries" class="hover:text-white">{{ 'landing.industries' | translate }}</a>
            <a routerLink="/contact" class="hover:text-white">{{ 'landing.contactNav' | translate }}</a>
          </nav>
          <div class="flex items-center gap-2">
            <a routerLink="/login" class="text-slate-300 hover:text-white px-2 py-1 rounded-md text-xs font-medium transition-colors">
              {{ 'common.login' | translate }}
            </a>
            <a routerLink="/register" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
              {{ 'common.register' | translate }}
            </a>
          </div>
        </div>
      </header>


      <section class="container mx-auto px-6 pt-8 pb-8">
        <div class="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-[#24344d] via-[#1f2f45] to-[#172436] p-8 md:p-12">
          <p class="text-blue-300 text-xs uppercase tracking-[0.2em] mb-4">{{ 'contactPage.hero.kicker' | translate }}</p>
          <h1 class="text-3xl md:text-5xl font-bold leading-tight max-w-4xl">{{ 'contactPage.hero.title' | translate }}</h1>
          <p class="text-slate-300 text-base md:text-lg mt-5 max-w-3xl leading-relaxed">{{ 'contactPage.hero.subtitle' | translate }}</p>
        </div>
      </section>

      <section class="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 bg-[#24344d] border border-slate-700/60 rounded-xl p-6 space-y-5">
          <h3 class="text-xl font-semibold">{{ 'contactPage.details.title' | translate }}</h3>
          <div>
            <p class="text-xs uppercase text-slate-400 tracking-wide">{{ 'contactPage.details.emailLabel' | translate }}</p>
            <a href="mailto:teamitmatrix@gmail.com" class="text-white hover:text-blue-300 break-all">teamitmatrix@gmail.com</a>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-400 tracking-wide">{{ 'contactPage.details.responseLabel' | translate }}</p>
            <p class="text-slate-300 text-sm">{{ 'contactPage.details.responseValue' | translate }}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-400 tracking-wide">{{ 'contactPage.details.noteLabel' | translate }}</p>
            <p class="text-slate-300 text-sm">{{ 'contactPage.details.noteValue' | translate }}</p>
          </div>
        </div>

        <div class="lg:col-span-2 bg-[#24344d] border border-slate-700/60 rounded-xl p-6 md:p-8">
          <h3 class="text-xl font-semibold mb-1">{{ 'contactPage.form.title' | translate }}</h3>
          <p class="text-slate-400 text-sm mb-6">{{ 'contactPage.form.subtitle' | translate }}</p>

          <form (ngSubmit)="submitForm()" class="space-y-4" novalidate>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-300 mb-1">{{ 'contactPage.form.name' | translate }}</label>
                <input [(ngModel)]="form.name" name="name" required
                       class="w-full rounded-md bg-[#1e293b] border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                       type="text" />
              </div>
              <div>
                <label class="block text-xs text-slate-300 mb-1">{{ 'contactPage.form.email' | translate }}</label>
                <input [(ngModel)]="form.email" name="email" required
                       class="w-full rounded-md bg-[#1e293b] border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                       type="email" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-300 mb-1">{{ 'contactPage.form.company' | translate }}</label>
                <input [(ngModel)]="form.company" name="company"
                       class="w-full rounded-md bg-[#1e293b] border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                       type="text" />
              </div>
              <div>
                <label class="block text-xs text-slate-300 mb-1">{{ 'contactPage.form.subject' | translate }}</label>
                <input [(ngModel)]="form.subject" name="subject"
                       class="w-full rounded-md bg-[#1e293b] border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                       type="text" />
              </div>
            </div>

            <div>
              <label class="block text-xs text-slate-300 mb-1">{{ 'contactPage.form.message' | translate }}</label>
              <textarea [(ngModel)]="form.message" name="message" required rows="6"
                        class="w-full rounded-md bg-[#1e293b] border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            <p *ngIf="errorMessage" class="text-rose-300 text-sm">{{ errorMessage }}</p>
            <p *ngIf="successMessage" class="text-emerald-300 text-sm">{{ successMessage }}</p>

            <button type="submit" [disabled]="isLoading"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors disabled:opacity-50">
              {{ (isLoading ? 'common.loading' : 'contactPage.form.submit') | translate }}
            </button>
          </form>
        </div>
      </section>
    </div>
  `
})
export class ContactPageComponent {
  form = {
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  };

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    public translationService: TranslationService,
    private contactService: ContactService
  ) {}

  submitForm(): void {
    if (this.isLoading) return;

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.form.name.trim() || !this.form.email.trim() || !this.form.message.trim()) {
      this.errorMessage = this.translationService.t('contactPage.form.requiredError');
      return;
    }

    this.isLoading = true;

    this.contactService.sendMessage({
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      company: this.form.company.trim(),
      subject: this.form.subject.trim() || this.translationService.t('contactPage.form.defaultSubject'),
      message: this.form.message.trim()
    }).subscribe({
      next: () => {
        this.successMessage = this.translationService.t('contactPage.form.success');
        this.form = {
          name: '',
          email: '',
          company: '',
          subject: '',
          message: ''
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Contact form submission error:', err);
        this.errorMessage = this.translationService.t('contactPage.form.error');
        this.isLoading = false;
      }
    });
  }
}
