import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LanguageSwitcherComponent, TranslatePipe],
  template: `
    <div class="min-h-screen bg-[#1e293b] font-sans text-white overflow-x-hidden"
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

      <!-- Hero Section -->
      <section id="overview" class="container mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12"
               [class.md:flex-row-reverse]="translationService.isRTL()">
        <div class="md:w-1/2 space-y-6">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            {{ 'landing.hero.title' | translate }}
          </h1>
          <p class="text-slate-300 text-lg leading-relaxed max-w-xl">
            {{ 'landing.hero.subtitle' | translate }}
          </p>
          <div class="flex flex-wrap gap-4 pt-4">
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium transition-colors flex items-center gap-2">
              {{ 'landing.hero.startTrial' | translate }} →
            </button>
                         <a href="https://youtu.be/qU2nbkUKCts" target="_blank" rel="noopener noreferrer" class="bg-transparent border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-8 py-3 rounded-md font-medium transition-colors inline-flex items-center justify-center">
              {{ 'landing.hero.watchDemo' | translate }}
                        </a>
          </div>
        </div>
        <div class="md:w-1/2 relative">
             <!-- Laptop/Dashboard Preview Placeholder using CSS -->
             <div class="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-700 transform md:rotate-y-12 md:-rotate-x-6 hover:rotate-0 transition-transform duration-700 perspective-1000">
                <!-- Mockup Content -->
                <div class="h-6 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-2">
                    <div class="w-2 h-2 rounded-full bg-red-500"></div>
                    <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div class="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <div class="p-6 bg-[#0f172a] opacity-90 h-64 md:h-80 w-full flex flex-col justify-center items-center text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-4 text-blue-500"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <span class="text-sm">{{ 'landing.hero.dashboardPreview' | translate }}</span>
                </div>
                 <!-- Decorative Gradient Overlay -->
                 <div class="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 pointer-events-none"></div>
             </div>
        </div>
      </section>

      <!-- Stats Grid -->
      <section class="container mx-auto px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-[#24344d] p-8 rounded-lg text-center border border-slate-700/50">
                <div class="text-4xl font-bold text-white mb-1">95%</div>
                <div class="text-sm text-slate-400">{{ 'landing.stats.complianceAccuracy' | translate }}</div>
            </div>
             <div class="bg-[#24344d] p-8 rounded-lg text-center border border-slate-700/50">
                <div class="text-4xl font-bold text-white mb-1">20x</div>
                <div class="text-sm text-slate-400">{{ 'landing.stats.fasterProcessing' | translate }}</div>
            </div>
             <div class="bg-[#24344d] p-8 rounded-lg text-center border border-slate-700/50">
                <div class="text-4xl font-bold text-white mb-1">50+</div>
                <div class="text-sm text-slate-400">{{ 'landing.stats.languagesSupported' | translate }}</div>
            </div>
             <div class="bg-[#24344d] p-8 rounded-lg text-center border border-slate-700/50">
                <div class="text-4xl font-bold text-white mb-1">85%</div>
                <div class="text-sm text-slate-400">{{ 'landing.stats.costReduction' | translate }}</div>
            </div>
        </div>
      </section>

      <!-- Two Column Section: About & Contact -->
      <section class="container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
           <!-- Who We Are -->
           <div class="bg-[#24344d] rounded-xl p-8 border border-slate-700/50 flex flex-col justify-between">
                <div>
                    <h3 class="text-xl font-semibold text-blue-400 mb-4">{{ 'landing.about.title' | translate }}</h3>
                    <p class="text-slate-300 text-sm leading-relaxed mb-4">
                        {{ 'landing.about.description1' | translate }}
                    </p>
                    <p class="text-slate-300 text-sm leading-relaxed mb-6">
                        {{ 'landing.about.description2' | translate }}
                    </p>
                </div>
                <!-- Mini Image Placeholder -->
                <div class="h-48 bg-slate-800 rounded-lg w-full overflow-hidden relative">
                    <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzNDE1NSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQxYThjIiBmb250LXNpemU9IjIwIj5PZmZpY2UgSW1hZ2UgUGxhY2Vob2xkZXI8L3RleHQ+PC9zdmc+" alt="Office" class="w-full h-full object-cover opacity-50">
                </div>
           </div>

           <!-- Contact Us -->
           <div class="bg-[#24344d] rounded-xl p-8 border border-slate-700/50 flex flex-col justify-between">
                <div>
                     <h3 class="text-xl font-semibold text-blue-400 mb-6">{{ 'landing.contact.title' | translate }}</h3>
                     <div class="space-y-4">
                         <div class="flex items-start gap-4"
                              [class.flex-row-reverse]="translationService.isRTL()">
                             <div class="text-slate-400 mt-1">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                             </div>
                             <div [class.text-right]="translationService.isRTL()">
                                 <div class="text-[10px] text-slate-500 uppercase tracking-wider">{{ 'landing.contact.landline' | translate }}</div>
                                 <div class="text-white text-sm font-medium">+923116886608</div>
                             </div>
                         </div>
                         
                         <div class="flex items-start gap-4"
                              [class.flex-row-reverse]="translationService.isRTL()">
                             <div class="text-slate-400 mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                             </div>
                              <div [class.text-right]="translationService.isRTL()">
                                 <div class="text-[10px] text-slate-500 uppercase tracking-wider">{{ 'landing.contact.email' | translate }}</div>
                                 <a href="mailto:teamitmatrix@gmail.com" class="text-white text-sm font-medium hover:text-blue-300 transition-colors">teamitmatrix@gmail.com</a>
                             </div>
                         </div>

                          <div class="flex items-start gap-4"
                               [class.flex-row-reverse]="translationService.isRTL()">
                             <div class="text-slate-400 mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                             </div>
                              <div [class.text-right]="translationService.isRTL()">
                                 <div class="text-[10px] text-slate-500 uppercase tracking-wider">{{ 'landing.contact.website' | translate }}</div>
                                 <a href="https://www.imta.io" target="_blank" rel="noopener noreferrer" class="text-white text-sm font-medium hover:text-blue-300 transition-colors">www.imta.io</a>
                             </div>
                         </div>
                     </div>
                </div>

                <div class="mt-8 border-t border-slate-600/50 pt-6">
                    <h4 class="text-white font-medium text-sm mb-2">{{ 'landing.contact.quickResponse' | translate }}</h4>
                    <p class="text-slate-400 text-xs mb-4">{{ 'landing.contact.quickResponseDesc' | translate }}</p>
                    <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium transition-colors text-sm">
                        {{ 'landing.contact.scheduleDemo' | translate }}
                    </button>
                </div>
           </div>
      </section>

      <!-- Features Grid -->
      <section id="features" class="container mx-auto px-6 py-12">
            <h3 class="text-center text-xl text-slate-300 font-medium mb-12">{{ 'landing.features.title' | translate }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Feature 1 -->
                <div class="bg-[#24344d] p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <h4 class="text-white font-medium mb-2">{{ 'landing.features.multilingual.title' | translate }}</h4>
                    <p class="text-slate-400 text-xs leading-relaxed">
                        {{ 'landing.features.multilingual.desc' | translate }}
                    </p>
                </div>
                 <!-- Feature 2 -->
                <div class="bg-[#24344d] p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <h4 class="text-white font-medium mb-2">{{ 'landing.features.textVoice.title' | translate }}</h4>
                     <p class="text-slate-400 text-xs leading-relaxed">
                        {{ 'landing.features.textVoice.desc' | translate }}
                    </p>
                </div>
                 <!-- Feature 3 -->
                <div class="bg-[#24344d] p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <h4 class="text-white font-medium mb-2">{{ 'landing.features.efficiency.title' | translate }}</h4>
                     <p class="text-slate-400 text-xs leading-relaxed">
                        {{ 'landing.features.efficiency.desc' | translate }}
                    </p>
                </div>
                <!-- Feature 4 -->
                <div class="bg-[#24344d] p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <h4 class="text-white font-medium mb-2">{{ 'landing.features.feedback.title' | translate }}</h4>
                     <p class="text-slate-400 text-xs leading-relaxed">
                        {{ 'landing.features.feedback.desc' | translate }}
                    </p>
                </div>
                 <!-- Feature 5 -->
                <div class="bg-[#24344d] p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <h4 class="text-white font-medium mb-2">{{ 'landing.features.scoring.title' | translate }}</h4>
                     <p class="text-slate-400 text-xs leading-relaxed">
                        {{ 'landing.features.scoring.desc' | translate }}
                    </p>
                </div>
                 <!-- Feature 6 -->
                <div class="bg-[#24344d] p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <h4 class="text-white font-medium mb-2">{{ 'landing.features.insights.title' | translate }}</h4>
                     <p class="text-slate-400 text-xs leading-relaxed">
                        {{ 'landing.features.insights.desc' | translate }}
                    </p>
                </div>
            </div>
      </section>

      <!-- Industries Section -->
      <section id="industries" class="container mx-auto px-6 py-12">
            <h3 class="text-center text-xl text-slate-300 font-medium mb-12">{{ 'landing.industries' | translate }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-[#24344d] p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <h4 class="text-white font-medium mb-2">{{ 'landing.industriesList.finance.title' | translate }}</h4>
                    <p class="text-slate-400 text-xs leading-relaxed">{{ 'landing.industriesList.finance.desc' | translate }}</p>
                </div>
                <div class="bg-[#24344d] p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <h4 class="text-white font-medium mb-2">{{ 'landing.industriesList.insurance.title' | translate }}</h4>
                    <p class="text-slate-400 text-xs leading-relaxed">{{ 'landing.industriesList.insurance.desc' | translate }}</p>
                </div>
                <div class="bg-[#24344d] p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <h4 class="text-white font-medium mb-2">{{ 'landing.industriesList.healthcare.title' | translate }}</h4>
                    <p class="text-slate-400 text-xs leading-relaxed">{{ 'landing.industriesList.healthcare.desc' | translate }}</p>
                </div>
                <div class="bg-[#24344d] p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <div class="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <h4 class="text-white font-medium mb-2">{{ 'landing.industriesList.customerSupport.title' | translate }}</h4>
                    <p class="text-slate-400 text-xs leading-relaxed">{{ 'landing.industriesList.customerSupport.desc' | translate }}</p>
                </div>
            </div>
      </section>

      <!-- Global Coverage & Footer -->
      <section class="container mx-auto px-6 py-12 mb-12">
           <div class="bg-[#24344d] rounded-2xl p-8 border border-slate-700/50 flex flex-col md:flex-row gap-12 items-center"
                [class.flex-row-reverse]="translationService.isRTL()">
               <div class="md:w-1/2"
                    [class.text-right]="translationService.isRTL()">
                    <h3 class="text-xl font-semibold text-blue-400 mb-4">{{ 'landing.languageCoverage.title' | translate }}</h3>
                    <p class="text-slate-300 text-sm mb-8 leading-relaxed">
                        {{ 'landing.languageCoverage.description' | translate }}
                    </p>

                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between text-xs text-slate-300 mb-1">
                                <span>English</span>
                                <span>97%</span>
                            </div>
                            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500 w-[97%]"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs text-slate-300 mb-1">
                                <span>French</span>
                                <span>95%</span>
                            </div>
                            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500 w-[95%]"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs text-slate-300 mb-1">
                                <span>German</span>
                                <span>94%</span>
                            </div>
                            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500 w-[94%]"></div>
                            </div>
                        </div>
                    </div>
               </div>

               <div class="md:w-1/2 flex justify-center">
                   <div class="w-64 h-64 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center relative">
                       <div class="absolute inset-0 border border-white/10 rounded-full animate-pulse"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-white drop-shadow-2xl"><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10 10 10 0 0 1 10-10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        <div class="absolute bg-green-400 text-[#0f172a] text-xs font-bold px-3 py-1 rounded shadow-lg top-10 right-10">AI</div>
                   </div>
               </div>
           </div>
      </section>

    </div>
  `,
  styles: []
})
export class LandingPageComponent {
  constructor(public readonly translationService: TranslationService) {}
}
