import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-industries-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, LanguageSwitcherComponent],
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
          <p class="text-blue-300 text-xs uppercase tracking-[0.2em] mb-4">{{ 'industriesPage.hero.kicker' | translate }}</p>
          <h1 class="text-3xl md:text-5xl font-bold leading-tight max-w-4xl">{{ 'industriesPage.hero.title' | translate }}</h1>
          <p class="text-slate-300 text-base md:text-lg mt-5 max-w-3xl leading-relaxed">{{ 'industriesPage.hero.subtitle' | translate }}</p>
        </div>
      </section>

      <section class="container mx-auto px-6 py-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article class="bg-[#24344d] border border-slate-700/60 rounded-xl p-6">
            <h3 class="text-lg font-semibold mb-2">{{ 'industriesPage.cards.wealth.title' | translate }}</h3>
            <p class="text-slate-300 text-sm leading-relaxed">{{ 'industriesPage.cards.wealth.desc' | translate }}</p>
          </article>
          <article class="bg-[#24344d] border border-slate-700/60 rounded-xl p-6">
            <h3 class="text-lg font-semibold mb-2">{{ 'industriesPage.cards.brokerage.title' | translate }}</h3>
            <p class="text-slate-300 text-sm leading-relaxed">{{ 'industriesPage.cards.brokerage.desc' | translate }}</p>
          </article>
          <article class="bg-[#24344d] border border-slate-700/60 rounded-xl p-6">
            <h3 class="text-lg font-semibold mb-2">{{ 'industriesPage.cards.insurance.title' | translate }}</h3>
            <p class="text-slate-300 text-sm leading-relaxed">{{ 'industriesPage.cards.insurance.desc' | translate }}</p>
          </article>
          <article class="bg-[#24344d] border border-slate-700/60 rounded-xl p-6">
            <h3 class="text-lg font-semibold mb-2">{{ 'industriesPage.cards.banking.title' | translate }}</h3>
            <p class="text-slate-300 text-sm leading-relaxed">{{ 'industriesPage.cards.banking.desc' | translate }}</p>
          </article>
          <article class="bg-[#24344d] border border-slate-700/60 rounded-xl p-6">
            <h3 class="text-lg font-semibold mb-2">{{ 'industriesPage.cards.fintech.title' | translate }}</h3>
            <p class="text-slate-300 text-sm leading-relaxed">{{ 'industriesPage.cards.fintech.desc' | translate }}</p>
          </article>
          <article class="bg-[#24344d] border border-slate-700/60 rounded-xl p-6">
            <h3 class="text-lg font-semibold mb-2">{{ 'industriesPage.cards.contactCenters.title' | translate }}</h3>
            <p class="text-slate-300 text-sm leading-relaxed">{{ 'industriesPage.cards.contactCenters.desc' | translate }}</p>
          </article>
        </div>
      </section>

      <section class="container mx-auto px-6 pb-14 pt-10">
        <div class="bg-[#24344d] border border-slate-700/60 rounded-xl p-8 md:p-10 text-center">
          <h3 class="text-2xl font-semibold mb-3">{{ 'industriesPage.bottomCta.title' | translate }}</h3>
          <p class="text-slate-300 text-sm md:text-base max-w-2xl mx-auto mb-6">{{ 'industriesPage.bottomCta.subtitle' | translate }}</p>
          <div class="flex flex-wrap justify-center gap-3">
            <a routerLink="/welcome" class="border border-slate-500 hover:border-slate-300 text-slate-200 hover:text-white px-6 py-3 rounded-md font-medium transition-colors">{{ 'featuresPage.bottomCta.backHome' | translate }}</a>
            <a routerLink="/register" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors">{{ 'landing.hero.startTrial' | translate }}</a>
          </div>
        </div>
      </section>
    </div>
  `
})
export class IndustriesPageComponent {
  constructor(public translationService: TranslationService) {}
}
