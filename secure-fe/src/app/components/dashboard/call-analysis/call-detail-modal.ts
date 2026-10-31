import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Call } from '../../../models/models';
import { ComplianceService } from '../../../services/compliance.service';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { QaParameterService } from '../../../services/qa-parameter.service';

@Component({
  selector: 'app-call-detail-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="fixed inset-0 z-[100] flex justify-end" [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      <div class="bg-[#1e293b] border-l border-[#334155] w-full max-w-2xl h-full overflow-hidden relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <!-- Modal Header -->
        <div class="p-6 border-b border-[#334155] flex justify-between items-center bg-[#1e293b]">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-3">
              {{ 'callDetail.title' | translate }}
              <span 
                  *ngIf="call?.analysis?.callType"
                  class="text-[10px] uppercase px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold"
              >
                  {{ localizedCallType }}
              </span>
              <span 
                  *ngIf="call?.analysis?.wasDealClosed"
                  class="text-[10px] uppercase px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400 font-bold flex items-center gap-1"
              >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {{ 'callDetail.dealClosed' | translate }}
              </span>
              <span
                  *ngIf="riskLevel"
                  class="text-[10px] uppercase px-2 py-0.5 rounded font-black tracking-widest flex items-center gap-1"
                  [ngClass]="{
                    'bg-emerald-500/10 border-emerald-500/40 text-emerald-400': riskLevel === 'LOW',
                    'bg-amber-500/10 border-amber-500/40 text-amber-400': riskLevel === 'MEDIUM',
                    'bg-red-500/10 border-red-500/40 text-red-400': riskLevel === 'HIGH'
                  }"
              >
                  <span class="w-1.5 h-1.5 rounded-full"
                        [ngClass]="{
                          'bg-emerald-400': riskLevel === 'LOW',
                          'bg-amber-400': riskLevel === 'MEDIUM',
                          'bg-red-400': riskLevel === 'HIGH'
                        }"></span>
                  {{ localizedRiskLevel }}
              </span>
              <span
                *ngIf="complianceStatus"
                class="text-[10px] uppercase px-2 py-0.5 rounded font-black tracking-widest"
                [ngClass]="getComplianceBadgeClasses()"
              >
                {{ localizedComplianceStatus }}
              </span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              {{ localizedCustomerName }} • {{ call?.timestamp | date:'long' }} • {{ 'callDetail.qaScore' | translate }}: {{ call?.analysis?.score ?? ('leadDetail.na' | translate) }}/100 • {{ 'callDetail.overallRiskScore' | translate }}: {{ riskScoreDisplay }}
            </p>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-900/50 scroll-smooth custom-scrollbar">
          <!-- Top Overview Row -->
          <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Compliance Summary Card -->
            <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <p class="text-[11px] font-bold text-slate-200 uppercase tracking-widest">{{ 'leadDetail.complianceSummary' | translate }}</p>
                <span class="text-[10px] font-black uppercase"
                      [ngClass]="getComplianceBadgeClasses()"
                      *ngIf="complianceStatus">
                  {{ complianceStatus | titlecase }}
                </span>
              </div>
              <div class="space-y-1 text-[11px] text-slate-300">
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ 'callDetail.scriptAdherence' | translate }}</span>
                  <span class="font-semibold">{{ scriptAdherenceDisplay }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ 'callDetail.riskDisclosures' | translate }}</span>
                  <span [ngClass]="disclosureStatusClass" class="font-semibold">
                    {{ disclosureStatusLabel }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ 'callDetail.misSelling' | translate }}</span>
                  <span [ngClass]="misSellingClass" class="font-semibold">
                    {{ misSellingLabel }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ 'callDetail.harassment' | translate }}</span>
                  <span [ngClass]="harassmentClass" class="font-semibold">
                    {{ harassmentLabel }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Fraud Detection Snapshot -->
            <div class="bg-slate-800/80 p-4 rounded-xl border border-red-500/30 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <p class="text-[11px] font-bold text-red-300 uppercase tracking-widest flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                  {{ 'leadDetail.fraudRisk' | translate }}
                </p>
                <span class="text-[11px] font-semibold text-red-200">
                  {{ fraudProbabilityPercent }}% {{ 'leadDetail.probability' | translate }}
                </span>
              </div>
              <p class="text-[11px] text-slate-300">
                {{ 'callDetail.riskyToneScore' | translate }}: <span class="font-semibold">{{ riskyTonePercent }}</span>
              </p>
              <p class="text-[11px] text-slate-400 line-clamp-3" *ngIf="topSuspiciousPhrase">
                {{ 'callDetail.keyPhrase' | translate }}: <span class="text-red-300 font-medium">"{{ topSuspiciousPhrase }}"</span>
              </p>
              <p class="text-[11px] text-slate-500" *ngIf="!topSuspiciousPhrase">
                {{ 'leadDetail.noFraudPhrases' | translate }}
              </p>
            </div>

            <!-- Regulatory Check Snapshot -->
            <div class="bg-slate-800/80 p-4 rounded-xl border border-blue-500/40 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <p class="text-[11px] font-bold text-blue-300 uppercase tracking-widest">{{ 'leadDetail.regulatoryCheck' | translate }}</p>
                <span *ngIf="escalationRequired"
                      class="text-[10px] uppercase px-2 py-0.5 rounded bg-red-500/10 border border-red-500/40 text-red-300 font-black">
                  {{ 'leadDetail.escalationRequired' | translate }}
                </span>
                <span *ngIf="!escalationRequired"
                      class="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-black">
                  {{ 'leadDetail.noEscalation' | translate }}
                </span>
              </div>
              <p class="text-[11px] text-slate-300">
                {{ 'callDetail.missingDisclosures' | translate }}: <span class="font-semibold">{{ missingDisclosuresCount }}</span>
              </p>
              <p class="text-[11px] text-slate-300">
                {{ 'callDetail.violationKeywords' | translate }}: <span class="font-semibold">{{ regulatoryViolationsCount }}</span>
              </p>
            </div>
          </section>

          <!-- Sequential Layout Fix: Everything stacked logically -->

          <!-- 1. AI Summary -->
            <section *ngIf="summaryText">
              <h4 class="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {{ 'callDetail.aiSummary' | translate }}
              </h4>
              <div class="bg-slate-800/80 p-5 rounded-xl border border-slate-700 text-slate-200 leading-relaxed italic relative overflow-hidden" dir="auto">
                  <div class="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                "{{ summaryText }}"
              </div>
          </section>

          <!-- 2. Coaching Tip Card -->
            <section *ngIf="coachingTipsText">
              <div class="p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden group">
                  <div class="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <svg class="w-24 h-24 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.243 15.657l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414zM6.464 14.95l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414z"></path>
                      </svg>
                  </div>
                  <h4 class="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                      {{ 'callDetail.aiCoachingTip' | translate }}
                  </h4>
                    <p class="text-sm text-slate-200 leading-relaxed font-medium" dir="auto">
                      {{ coachingTipsText }}
                    </p>
              </div>
          </section>

          <!-- 3. MiFID Compliance Section -->
          <section *ngIf="call?.analysis?.mifidCompliance || call?.analysis?.clientCategory || call?.analysis?.suitabilityScore !== null" class="bg-blue-900/20 p-5 rounded-xl border border-blue-500/30">
              <h4 class="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 5.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  {{ 'callDetail.mifidCompliance' | translate }}
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Suitability Assessment -->
                  <div class="p-3 rounded-lg bg-black/20 border border-white/5">
                      <div class="flex items-center justify-between mb-2">
                          <p class="text-[11px] font-bold text-slate-200 uppercase">{{ 'leadDetail.suitabilityAssessment' | translate }}</p>
                          <span [ngClass]="{
                              'text-green-500': call?.analysis?.suitabilityScore !== null && call?.analysis?.suitabilityScore !== undefined,
                              'text-red-400': call?.analysis?.suitabilityScore === null || call?.analysis?.suitabilityScore === undefined
                          }" class="text-[9px] font-black uppercase">
                              {{ call?.analysis?.suitabilityScore !== null ? ('leadDetail.pass' | translate) : ('leadDetail.fail' | translate) }}
                          </span>
                      </div>
                      <p class="text-[10px] text-slate-500">
                          {{ 'callDetail.score' | translate }}: {{ call?.analysis?.suitabilityScore ?? ('callDetail.notAssessed' | translate) }}
                      </p>
                  </div>
                  
                  <!-- Best Execution -->
                  <div class="p-3 rounded-lg bg-black/20 border border-white/5">
                      <div class="flex items-center justify-between mb-2">
                          <p class="text-[11px] font-bold text-slate-200 uppercase">{{ 'leadDetail.bestExecution' | translate }}</p>
                          <span [ngClass]="{
                              'text-green-500': call?.analysis?.bestExecutionCheck === true,
                              'text-red-400': call?.analysis?.bestExecutionCheck !== true
                          }" class="text-[9px] font-black uppercase">
                              {{ (call?.analysis?.bestExecutionCheck ? 'compliance.verified' : 'compliance.notVerified') | translate }}
                          </span>
                      </div>
                      <p class="text-[10px] text-slate-500">
                          {{ (call?.analysis?.bestExecutionCheck ? 'callDetail.bestExecutionConfirmed' : 'callDetail.bestExecutionNotVerified') | translate }}
                      </p>
                  </div>
                  
                  <!-- Client Categorization -->
                  <div class="p-3 rounded-lg bg-black/20 border border-white/5">
                      <div class="flex items-center justify-between mb-2">
                          <p class="text-[11px] font-bold text-slate-200 uppercase">{{ 'leadDetail.clientCategory' | translate }}</p>
                          <span *ngIf="call?.analysis?.clientCategory" class="text-[9px] font-black uppercase text-blue-400">
                              {{ localizedClientCategory }}
                          </span>
                          <span *ngIf="!call?.analysis?.clientCategory" class="text-[9px] font-black uppercase text-red-400">
                              {{ 'compliance.notSet' | translate }}
                          </span>
                      </div>
                      <p class="text-[10px] text-slate-500">
                            {{ localizedClientCategoryDescription }}
                      </p>
                  </div>
                  
                  <!-- Overall Compliance Status -->
                  <div class="p-3 rounded-lg bg-black/20 border border-white/5">
                      <div class="flex items-center justify-between mb-2">
                          <p class="text-[11px] font-bold text-slate-200 uppercase">{{ 'leadDetail.overallStatus' | translate }}</p>
                          <span *ngIf="getComplianceStatus() === 'COMPLIANT'" class="text-[9px] font-black uppercase text-green-500">
                              {{ 'compliance.compliant' | translate }}
                          </span>
                          <span *ngIf="getComplianceStatus() === 'PARTIAL'" class="text-[9px] font-black uppercase text-yellow-500">
                              {{ 'compliance.partial' | translate }}
                          </span>
                          <span *ngIf="getComplianceStatus() === 'NON_COMPLIANT'" class="text-[9px] font-black uppercase text-red-400">
                              {{ 'compliance.nonCompliant' | translate }}
                          </span>
                      </div>
                      <p class="text-[10px] text-slate-500">
                          {{ getComplianceStatusText() }}
                      </p>
                  </div>
              </div>
              <button 
                  *ngIf="call?.id"
                  (click)="runComplianceCheck()"
                  class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase transition-all flex items-center gap-2"
              >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  {{ 'leadDetail.runComplianceCheck' | translate }}
              </button>
          </section>

          <!-- 3. QA Compliance Section -->
          <section *ngIf="localizedQaResults.length" class="bg-slate-800/40 p-5 rounded-xl border border-slate-700">
              <h4 class="text-teal-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {{ 'leadDetail.aiQaCompliance' | translate }}
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div *ngFor="let entry of localizedQaResults" class="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-white/5 group hover:border-white/10 transition-colors">
                      <div [ngClass]="{
                          'text-green-500 bg-green-500/10': entry.item.status === 'PASS',
                          'text-red-500 bg-red-500/10': entry.item.status === 'FAIL',
                          'text-slate-500 bg-slate-500/10': entry.item.status === 'N/A'
                      }" class="p-1 rounded-full flex-shrink-0">
                          <svg *ngIf="entry.item.status === 'PASS'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                          <svg *ngIf="entry.item.status === 'FAIL'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          <svg *ngIf="entry.item.status === 'N/A'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                      </div>
                      <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between mb-0.5">
                                <p class="text-[11px] font-bold text-slate-200 uppercase tracking-tight" dir="auto">{{ entry.item.parameter }}</p>
                              <span [ngClass]="{
                                  'text-green-500': entry.item.status === 'PASS',
                                  'text-red-400': entry.item.status === 'FAIL',
                                  'text-slate-500': entry.item.status === 'N/A'
                              }" class="text-[9px] font-black uppercase tracking-widest">{{ (entry.item.status === 'PASS' ? 'leadDetail.pass' : entry.item.status === 'FAIL' ? 'leadDetail.fail' : 'leadDetail.na') | translate }}</span>
                          </div>
                              <p class="text-[10px] text-slate-500 italic line-clamp-2 group-hover:line-clamp-none transition-all" dir="auto">{{ entry.item.notes }}</p>
                      </div>
                  </div>
              </div>
          </section>

          <!-- 4. Objection Handling -->
          <section *ngIf="localizedObjections.length">
              <h4 class="text-red-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  {{ 'leadDetail.customerObjections' | translate }}
              </h4>
              <div class="flex flex-wrap gap-2">
                    <div *ngFor="let obj of localizedObjections" 
                       class="px-4 py-2 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-200">
                      {{ obj }}
                  </div>
              </div>
          </section>

          <!-- 5. Metadata Grid (Agent Context, Topics, Action Items) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
              <div class="space-y-8">
                  <!-- Agent Profile -->
                  <section *ngIf="call?.analysis?.agentDetails" class="bg-[#1b2a3a]/30 p-4 rounded-xl border border-slate-700/50">
                      <h4 class="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                          {{ 'callDetail.agentProfile' | translate }}
                      </h4>
                      <div class="grid grid-cols-1 gap-4">
                          <div class="flex items-center justify-between border-b border-white/5 pb-2">
                              <p class="text-[10px] text-white/40 uppercase font-bold">{{ 'callDetail.roleTitle' | translate }}</p>
                                <p class="text-sm text-white font-medium ml-4" dir="auto">{{ displayAgentRole }}</p>
                          </div>
                          <div class="flex items-center justify-between border-b border-white/5 pb-2">
                              <p class="text-[10px] text-white/40 uppercase font-bold">{{ 'callDetail.company' | translate }}</p>
                                <p class="text-sm text-white font-medium ml-4" dir="auto">{{ displayAgentCompany }}</p>
                          </div>
                      </div>
                            <div *ngIf="agentPainPoints.length" class="mt-4">
                          <p class="text-[10px] text-white/40 uppercase font-bold mb-2">{{ 'callDetail.agentStruggles' | translate }}</p>
                          <div class="flex flex-wrap gap-2">
                                <span *ngFor="let pp of agentPainPoints" class="px-2 py-1 bg-red-400/10 text-red-400 text-[10px] rounded border border-red-400/20" dir="auto">
                                  {{ pp }}
                              </span>
                          </div>
                      </div>
                  </section>

                  <!-- Key Topics -->
                          <section *ngIf="localizedTopics.length">
                      <h4 class="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">{{ 'callDetail.keyTopics' | translate }}</h4>
                      <div class="flex flex-wrap gap-2">
                              <span *ngFor="let topic of localizedTopics" class="bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-300 border border-slate-700" dir="auto">
                              {{ topic }}
                          </span>
                      </div>
                  </section>

                  <!-- Action Items -->
                          <section *ngIf="localizedActionItems.length">
                      <h4 class="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">{{ 'callDetail.actionItems' | translate }}</h4>
                      <ul class="space-y-2">
                              <li *ngFor="let item of localizedActionItems" class="flex items-start gap-3 text-xs text-slate-300" dir="auto">
                              <span class="text-emerald-500 mt-0.5">•</span>
                              {{ item }}
                          </li>
                      </ul>
                  </section>
              </div>

              <!-- 6. Full Transcript Trigger -->
              <section class="bg-emerald-600/5 p-8 rounded-2xl border border-emerald-500/20 flex flex-col items-center text-center space-y-4">
                <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                </div>
                <div>
                  <h4 class="text-white font-bold text-lg mb-1">{{ 'transcript.detailedConversationTranscript' | translate }}</h4>
                  <p class="text-slate-400 text-sm max-w-sm mx-auto">{{ 'transcript.detailedTranscriptDesc' | translate }}</p>
                </div>
                <div class="flex flex-wrap items-center justify-center gap-3">
                  <button 
                    (click)="viewTranscript.emit('en')"
                    class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/40 flex items-center gap-2 group"
                  >
                    {{ 'transcript.viewEnglish' | translate }}
                    <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5-5 5M6 7l5 5-5 5"></path>
                    </svg>
                  </button>
                  <button 
                    (click)="viewTranscript.emit('ar')"
                    class="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all border border-slate-500 flex items-center gap-2 group"
                  >
                    {{ 'transcript.viewArabic' | translate }}
                    <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5-5 5M6 7l5 5-5 5"></path>
                    </svg>
                  </button>
                </div>
              </section>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 border-t border-[#334155] flex justify-between items-center bg-[#1e293b]">
          <div class="flex items-center gap-2">
            <button (click)="close.emit()" class="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 uppercase font-bold tracking-widest">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              {{ 'callDetail.back' | translate }}
            </button>
          </div>
          <div class="flex gap-3">
            <button (click)="close.emit()" class="px-6 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all border border-slate-600/50">
              {{ 'callDetail.closeDetail' | translate }}
            </button>
            <button (click)="downloadPdf.emit(call!)" class="px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              {{ 'callDetail.pdfReport' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #475569;
    }
  `]
})
export class CallDetailModalComponent implements OnInit {
  @Input() call: Call | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() downloadPdf = new EventEmitter<Call>();
  @Output() viewTranscript = new EventEmitter<'en' | 'ar'>();

  private readonly qaParamNameMap = new Map<string, string>();

  constructor(
    private readonly complianceService: ComplianceService,
    public readonly translationService: TranslationService,
    private readonly qaParameterService: QaParameterService
  ) {}

  ngOnInit(): void {
    this.qaParameterService.getAll().subscribe({
      next: (params) => {
        this.qaParamNameMap.clear();
        params.forEach(p => {
          if (p.nameAr) {
            this.qaParamNameMap.set(p.name.toUpperCase().trim(), p.nameAr);
          }
        });
      },
      error: () => { /* silently ignore — English names will be shown as fallback */ }
    });
  }

  get isArabicSelected(): boolean {
    return this.translationService.getCurrentLanguage() === 'ar';
  }

      get localizedCustomerName(): string {
    const value = this.localizeText(this.call?.customerName, this.call?.customerNameAr);
    return value || this.translationService.translate('callDetail.unknown');
  }

  get localizedCallType(): string {
    return this.localizeText(this.call?.analysis?.callType, this.call?.analysis?.callTypeAr);
  }

  get localizedRiskLevel(): string {
    if (this.riskLevel === 'LOW') {
      return this.translationService.translate('callDetail.lowRisk');
    }
    if (this.riskLevel === 'MEDIUM') {
      return this.translationService.translate('callDetail.mediumRisk');
    }
    if (this.riskLevel === 'HIGH') {
      return this.translationService.translate('callDetail.highRisk');
    }
    return '';
  }

  get localizedComplianceStatus(): string {
    if (this.complianceStatus === 'COMPLIANT') {
      return this.translationService.translate('leadDetail.compliant');
    }
    if (this.complianceStatus === 'RISKY') {
      return this.translationService.translate('leadDetail.risky');
    }
    if (this.complianceStatus === 'HIGH_RISK') {
      return this.translationService.translate('leadDetail.highRiskLabel');
    }
    if (this.complianceStatus === 'FRAUD_ALERT') {
      return this.translationService.translate('callDetail.fraudAlert');
    }
    return '';
  }

  get summaryText(): string {
    return this.localizeText(this.call?.analysis?.summary, this.call?.analysis?.summaryAr);
  }

  get coachingTipsText(): string {
    return this.localizeText(this.call?.analysis?.coachingTips, this.call?.analysis?.coachingTipsAr);
  }

  get localizedQaResults(): Array<{ item: { parameter: string; status: 'PASS' | 'FAIL' | 'N/A'; notes: string }; originalIndex: number }> {
    const raw = Array.isArray(this.call?.analysis?.qaResults) ? this.call?.analysis?.qaResults : [];
    const localized = Array.isArray(this.call?.analysis?.qaResultsAr) ? this.call?.analysis?.qaResultsAr : [];
    const baseLength = Math.max(raw.length, localized.length);
    const seen = new Set<string>();
    const result: Array<{ item: { parameter: string; status: 'PASS' | 'FAIL' | 'N/A'; notes: string }; originalIndex: number }> = [];

    for (let index = 0; index < baseLength; index++) {
      const englishItem = raw[index];
      const localizedItem = localized[index];
      // Arabic parameter name: prefer AI-generated translation, then fall back to GlobalQAParameter.nameAr lookup
      const arabicParamName = localizedItem?.parameter
        || this.qaParamNameMap.get((englishItem?.parameter || '').toUpperCase().trim())
        || undefined;
      const parameter = this.localizeText(englishItem?.parameter, arabicParamName);
      const status = (englishItem?.status || localizedItem?.status || 'N/A') as 'PASS' | 'FAIL' | 'N/A';
      const notes = this.localizeText(englishItem?.notes, localizedItem?.notes);
      const dedupeKey = (englishItem?.parameter || localizedItem?.parameter || '').toLowerCase().trim();

      if (!dedupeKey || seen.has(dedupeKey)) {
        continue;
      }

      seen.add(dedupeKey);
      result.push({
        item: {
          parameter,
          status,
          notes
        },
        originalIndex: index
      });
    }

    return result;
  }

  get localizedObjections(): string[] {
    return this.localizeArray(this.call?.analysis?.objections, this.call?.analysis?.objectionsAr);
  }

  get localizedTopics(): string[] {
    return this.localizeArray(this.call?.analysis?.topics, this.call?.analysis?.topicsAr);
  }

  get localizedActionItems(): string[] {
    return this.localizeArray(this.call?.analysis?.actionItems, this.call?.analysis?.actionItemsAr);
  }

  get agentPainPoints(): string[] {
    return this.localizeArray(this.call?.analysis?.agentDetails?.painPoints, this.call?.analysis?.agentDetailsAr?.painPoints);
  }

  get displayAgentRole(): string {
    return this.normalizeDisplayValue(this.localizeText(this.call?.analysis?.agentDetails?.role, this.call?.analysis?.agentDetailsAr?.role));
  }

  get displayAgentCompany(): string {
    return this.normalizeDisplayValue(this.localizeText(this.call?.analysis?.agentDetails?.company, this.call?.analysis?.agentDetailsAr?.company));
  }

  get localizedClientCategory(): string {
    const category = this.call?.analysis?.clientCategory;
    if (!category) {
      return this.translationService.translate('compliance.notSet');
    }

    if (category === 'RETAIL') {
      return this.translationService.translate('callDetail.clientCategoryRetail');
    }
    if (category === 'PROFESSIONAL') {
      return this.translationService.translate('callDetail.clientCategoryProfessional');
    }
    if (category === 'ELIGIBLE_COUNTERPARTY') {
      return this.translationService.translate('callDetail.clientCategoryEligibleCounterparty');
    }

    return category;
  }

  get localizedClientCategoryDescription(): string {
    return this.call?.analysis?.clientCategory
      ? this.localizedClientCategory
      : this.translationService.translate('callDetail.clientNotCategorized');
  }

  private localizeText(englishText?: string | null, arabicText?: string | null): string {
    const englishValue = this.normalizeText(englishText);
    const arabicValue = this.normalizeText(arabicText);

    if (this.isArabicSelected) {
      return arabicValue || englishValue || '';
    }

    return englishValue || arabicValue || '';
  }

  private localizeArray(englishValues?: string[] | null, arabicValues?: string[] | null): string[] {
    const english = this.normalizeStringArray(englishValues);
    const arabic = this.normalizeStringArray(arabicValues);

    if (this.isArabicSelected) {
      return arabic.length ? arabic : english;
    }

    return english.length ? english : arabic;
  }

  private normalizeText(value?: string | null): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeStringArray(values?: string[] | null): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return values
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0);
  }

  private normalizeDisplayValue(value?: string | null): string {
    const normalized = this.normalizeText(value);
    if (!normalized || normalized === '--') {
      return '--';
    }
    if (normalized.toLowerCase() === 'unknown') {
      return this.translationService.translate('callDetail.unknown');
    }
    return normalized;
  }

  /**
   * Unified Risk Engine (FE-side)
   * Derives a 0–100 risk score and label purely from the existing
   * `CallAnalysis` fields. Safe even if backend has not yet been
   * migrated to store the extended attributes.
   */

  get riskScore(): number {
    const a = this.call?.analysis;
    if (!a) {
      return 0;
    }

    let score = 0;

    // 1) Base QA quality (lower QA score → higher risk contribution)
    const qaScore = typeof a.score === 'number' ? a.score : 50;
    if (qaScore >= 80) {
      score += 10;
    } else if (qaScore >= 60) {
      score += 25;
    } else {
      score += 45;
    }

    // 2) MiFID / compliance posture
    const mifidStatus = a.mifidCompliance?.overallStatus;
    if (mifidStatus === 'COMPLIANT') {
      score += 0;
    } else if (mifidStatus === 'PARTIAL') {
      score += 15;
    } else if (mifidStatus === 'NON_COMPLIANT') {
      score += 30;
    }

    // Missing core MiFID checks
    const hasSuitability = a.suitabilityScore !== null && a.suitabilityScore !== undefined;
    const hasBestExecution = a.bestExecutionCheck === true;
    const hasCategorization = a.clientCategory !== null && a.clientCategory !== undefined;
    if (!hasSuitability) {
      score += 10;
    }
    if (!hasBestExecution) {
      score += 10;
    }
    if (!hasCategorization) {
      score += 5;
    }

    // 3) Fraud / misconduct indicators
    const misSelling = a.misSellingDetected === true;
    const falsePromise = a.falsePromiseDetected === true;
    const harassment = a.harassmentDetected === true;
    const repeatedPattern = a.repeatedCallPatternDetected === true;

    if (misSelling) {
      score += 15;
    }
    if (falsePromise) {
      score += 10;
    }
    if (harassment) {
      score += 15;
    }
    if (repeatedPattern) {
      score += 10;
    }

    const fraudProbability = typeof a.fraudProbability === 'number' ? a.fraudProbability : null; // 0–1
    const riskyTone = typeof a.riskyToneScore === 'number' ? a.riskyToneScore : null; // 0–1

    if (fraudProbability !== null) {
      score += fraudProbability * 40;
    }
    if (riskyTone !== null) {
      score += riskyTone * 20;
    }

    // 4) Escalation / regulatory red flags
    if (a.escalationRequired) {
      score += 20;
    }

    // Clamp to 0–100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  get riskScoreDisplay(): string {
    return `${this.riskScore}/100`;
  }

  get riskLevel(): 'LOW' | 'MEDIUM' | 'HIGH' | null {
    if (!this.call?.analysis) {
      return null;
    }
    const score = this.riskScore;
    if (score < 34) {
      return 'LOW';
    }
    if (score < 67) {
      return 'MEDIUM';
    }
    return 'HIGH';
  }

  /**
   * Compliance status badge used both in header and summary card:
   * - COMPLIANT
   * - RISKY
   * - HIGH_RISK
   * - FRAUD_ALERT
   */
  get complianceStatus(): 'COMPLIANT' | 'RISKY' | 'HIGH_RISK' | 'FRAUD_ALERT' | null {
    const a = this.call?.analysis;
    if (!a) {
      return null;
    }

    const fraudProbability = typeof a.fraudProbability === 'number' ? a.fraudProbability : 0;
    const misSelling = a.misSellingDetected === true;
    const harassment = a.harassmentDetected === true;
    const falsePromise = a.falsePromiseDetected === true;
    const escalation = a.escalationRequired === true;
    const score = this.riskScore;

    // Hard fraud / escalation conditions
    if (
      fraudProbability >= 0.7 ||
      (misSelling && harassment) ||
      escalation
    ) {
      return 'FRAUD_ALERT';
    }

    if (score >= 67 || misSelling || falsePromise) {
      return 'HIGH_RISK';
    }

    if (score >= 40) {
      return 'RISKY';
    }

    return 'COMPLIANT';
  }

  getComplianceBadgeClasses(): string {
    const status = this.complianceStatus;
    if (status === 'COMPLIANT') {
      return 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300';
    }
    if (status === 'RISKY') {
      return 'bg-amber-500/10 border border-amber-500/40 text-amber-300';
    }
    if (status === 'HIGH_RISK') {
      return 'bg-red-500/10 border border-red-500/40 text-red-300';
    }
    if (status === 'FRAUD_ALERT') {
      return 'bg-rose-600/15 border border-rose-500/60 text-rose-200';
    }
    return 'bg-slate-700/40 border border-slate-600/60 text-slate-200';
  }

  getComplianceStatus(): 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' {
    if (!this.call?.analysis) return 'NON_COMPLIANT';
    
    const hasSuitability = this.call.analysis.suitabilityScore !== null && this.call.analysis.suitabilityScore !== undefined;
    const hasBestExecution = this.call.analysis.bestExecutionCheck === true;
    const hasCategorization = this.call.analysis.clientCategory !== null && this.call.analysis.clientCategory !== undefined;
    
    const passedChecks = [hasSuitability, hasBestExecution, hasCategorization].filter(Boolean).length;
    
    if (passedChecks === 3) return 'COMPLIANT';
    if (passedChecks >= 1) return 'PARTIAL';
    return 'NON_COMPLIANT';
  }

  getComplianceStatusText(): string {
    const status = this.getComplianceStatus();
    if (status === 'COMPLIANT') return this.translationService.translate('callDetail.allMifidMet');
    if (status === 'PARTIAL') return this.translationService.translate('callDetail.someMifidMissing');
    return this.translationService.translate('callDetail.mifidNotVerified');
  }

  runComplianceCheck(): void {
    if (!this.call?.id) return;
    
    this.complianceService.runComplianceCheck(this.call.id).subscribe({
      next: (result) => {
        // Update call with compliance results
        if (this.call?.analysis) {
          this.call.analysis.mifidCompliance = result.complianceResult as any;
          this.call.analysis.suitabilityScore = result.complianceResult.suitabilityAssessment ? 100 : null;
          this.call.analysis.bestExecutionCheck = result.complianceResult.bestExecution;
        }
      },
      error: (error) => {
        console.error('Failed to run compliance check', error);
      }
    });
  }

  /**
   * Compliance summary helpers (script adherence, disclosures, mis-selling, harassment)
   */

  get scriptAdherenceDisplay(): string {
    const value = this.call?.analysis?.scriptAdherenceScore;
    if (typeof value === 'number') {
      return `${value}%`;
    }
    const qaScore = this.call?.analysis?.score;
    if (typeof qaScore === 'number') {
      return `${qaScore}%`;
    }
    return this.translationService.translate('leadDetail.na');
  }

  get disclosureStatusLabel(): string {
    const status = this.call?.analysis?.riskDisclosureStatus;
    if (status === 'COMPLIANT') {
      return this.translationService.translate('callDetail.complete');
    }
    if (status === 'MISSING') {
      return this.translationService.translate('callDetail.missing');
    }
    if (status === 'PARTIAL') {
      return this.translationService.translate('callDetail.partialStatus');
    }
    return this.translationService.translate('callDetail.unknown');
  }

  get disclosureStatusClass(): string {
    const status = this.call?.analysis?.riskDisclosureStatus;
    if (status === 'COMPLIANT') {
      return 'text-emerald-400';
    }
    if (status === 'MISSING') {
      return 'text-red-400';
    }
    if (status === 'PARTIAL') {
      return 'text-amber-300';
    }
    return 'text-slate-300';
  }

  get misSellingLabel(): string {
    const value = this.call?.analysis?.misSellingDetected;
    if (value === true) {
      return this.translationService.translate('callDetail.detected');
    }
    if (value === false) {
      return this.translationService.translate('callDetail.notDetected');
    }
    return this.translationService.translate('callDetail.unknown');
  }

  get misSellingClass(): string {
    const value = this.call?.analysis?.misSellingDetected;
    if (value === true) {
      return 'text-red-400';
    }
    if (value === false) {
      return 'text-emerald-400';
    }
    return 'text-slate-300';
  }

  get harassmentLabel(): string {
    const value = this.call?.analysis?.harassmentDetected;
    if (value === true) {
      return this.translationService.translate('callDetail.detected');
    }
    if (value === false) {
      return this.translationService.translate('callDetail.notDetected');
    }
    return this.translationService.translate('callDetail.unknown');
  }

  get harassmentClass(): string {
    const value = this.call?.analysis?.harassmentDetected;
    if (value === true) {
      return 'text-red-400';
    }
    if (value === false) {
      return 'text-emerald-400';
    }
    return 'text-slate-300';
  }

  /**
   * Fraud & regulatory snapshot helpers
   */

  get fraudProbabilityPercent(): number {
    const value = this.call?.analysis?.fraudProbability;
    if (typeof value === 'number') {
      return Math.round(value * 100);
    }
    const misSelling = this.call?.analysis?.misSellingDetected === true;
    const harassment = this.call?.analysis?.harassmentDetected === true;
    const falsePromise = this.call?.analysis?.falsePromiseDetected === true;
    const escalated = this.call?.analysis?.escalationRequired === true;
    const flags = [misSelling, harassment, falsePromise, escalated].filter(Boolean).length;
    if (flags === 0) {
      return 5;
    }
    if (flags === 1) {
      return 30;
    }
    if (flags === 2) {
      return 55;
    }
    return 80;
  }

  get riskyTonePercent(): string {
    const value = this.call?.analysis?.riskyToneScore;
    if (typeof value === 'number') {
      return `${Math.round(value * 100)}%`;
    }
    return 'N/A';
  }

  get topSuspiciousPhrase(): string | null {
    const phrases = this.call?.analysis?.suspiciousPhrases || [];
    if (phrases.length > 0) {
      return phrases[0];
    }
    const pressure = this.call?.analysis?.pressureSellingIndicators || [];
    if (pressure.length > 0) {
      return pressure[0];
    }
    const financial = this.call?.analysis?.financialManipulationKeywords || [];
    if (financial.length > 0) {
      return financial[0];
    }
    return null;
  }

  get escalationRequired(): boolean {
    return this.call?.analysis?.escalationRequired === true;
  }

  get missingDisclosuresCount(): number {
    return this.call?.analysis?.missingMandatoryDisclosures?.length || 0;
  }

  get regulatoryViolationsCount(): number {
    return this.call?.analysis?.regulatoryViolationKeywords?.length || 0;
  }
}
