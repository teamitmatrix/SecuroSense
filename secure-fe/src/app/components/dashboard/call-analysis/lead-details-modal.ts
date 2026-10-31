import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lead, Call } from '../../../models/models';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type ComplianceStatus = 'COMPLIANT' | 'RISKY' | 'HIGH_RISK' | 'FRAUD_ALERT';

@Component({
    selector: 'app-lead-details-modal',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    template: `
    <div class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
      
      <div class="relative bg-[#0b1b1b] w-full max-w-5xl h-full border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        <!-- Modal Header -->
        <div class="p-4 bg-[#0a664e] flex justify-between items-center">
          <div class="min-w-0">
            <h2 class="text-xl font-bold text-white tracking-tight truncate">{{ 'leadDetail.combinedCall' | translate }}</h2>
            <p class="text-[11px] text-white/70 mt-0.5 truncate" *ngIf="lead?.customerName">
              {{ lead?.customerName }}
            </p>
            <p class="text-[11px] text-white/60 mt-0.5 truncate" dir="auto" *ngIf="lead?.customerNameAr">
              {{ lead?.customerNameAr }}
            </p>
          </div>
          <button (click)="modalClose.emit()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all">
              <svg class="w-6 h-6 border-2 border-current rounded-full p-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8 bg-[#0b1b1b]">
          <!-- Header Stats -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-[#0b1e1e] border border-emerald-500/20 rounded h-20 p-4 flex items-center gap-4">
               <div class="w-10 h-10 rounded bg-[#102a2a] flex items-center justify-center border border-green-500/30">
                  <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
               </div>
               <div>
                  <div class="text-[10px] text-white/60 font-bold uppercase">{{ 'leadDetail.totalCalls' | translate }}:</div>
                  <div class="text-2xl font-bold text-green-500">{{ getFilteredCalls().length || 0 }}</div>
               </div>
            </div>
            <div class="bg-[#0b1e1e] border border-teal-500/20 rounded h-20 p-4 flex items-center gap-4">
               <div class="w-10 h-10 rounded bg-[#10102a] flex items-center justify-center border border-teal-500/30">
                  <svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
               </div>
               <div>
                  <div class="text-[10px] text-white/60 font-bold uppercase">{{ 'leadDetail.aiAutomatedQa' | translate }}:</div>
                  <div class="text-2xl font-bold text-teal-400">{{ complianceScore }}%</div>
               </div>
            </div>
            <div class="bg-[#0b1e1e] border border-emerald-500/20 rounded h-20 p-4 flex items-center gap-4">
               <div class="w-10 h-10 rounded bg-[#0b1a2a] flex items-center justify-center border border-emerald-500/30">
                  <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
               </div>
               <div>
                  <div class="text-[10px] text-white/60 font-bold uppercase">{{ 'leadDetail.avgScore' | translate }}:</div>
                  <div class="text-2xl font-bold text-emerald-400">{{ avgScore }}%</div>
               </div>
            </div>
          </div>

          <!-- Compliance / Fraud / Regulatory Snapshot -->
          <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Compliance Summary -->
            <div class="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[11px] font-bold text-slate-200 uppercase tracking-widest">{{ 'leadDetail.complianceSummary' | translate }}</p>
                <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded"
                      [ngClass]="getComplianceBadgeClasses(getOverallComplianceStatus())">
                  {{ getComplianceStatusLabel(getOverallComplianceStatus()) }}
                </span>
              </div>
              <div class="space-y-1 text-[11px] text-slate-300">
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ 'leadDetail.highRisk' | translate }}</span>
                  <span class="font-semibold">{{ getHighRiskCount() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ 'leadDetail.fraudAlerts' | translate }}</span>
                  <span class="font-semibold">{{ getFraudAlertCount() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ 'leadDetail.escalations' | translate }}</span>
                  <span class="font-semibold">{{ getEscalationCount() }}</span>
                </div>
              </div>
            </div>

            <!-- Fraud Risk -->
            <div class="bg-slate-800/40 p-4 rounded-xl border border-red-500/30">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[11px] font-bold text-red-300 uppercase tracking-widest flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                  {{ 'leadDetail.fraudRisk' | translate }}
                </p>
                <span class="text-[11px] font-semibold text-red-200">
                  {{ getOverallFraudProbabilityPercent() }}% {{ 'leadDetail.probability' | translate }}
                </span>
              </div>
              <p class="text-[11px] text-slate-300">
                {{ 'leadDetail.highestRiskyTone' | translate }}: <span class="font-semibold">{{ getOverallRiskyToneDisplay() }}</span>
              </p>
              <p class="text-[11px] text-slate-500 mt-1">
                {{ getFraudAlertCount() > 0 ? ('leadDetail.fraudIndicatorsDetected' | translate) : ('leadDetail.noFraudPhrases' | translate) }}
              </p>
            </div>

            <!-- Regulatory Check -->
            <div class="bg-slate-800/40 p-4 rounded-xl border border-blue-500/40">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[11px] font-bold text-blue-300 uppercase tracking-widest">{{ 'leadDetail.regulatoryCheck' | translate }}</p>
                <span *ngIf="getEscalationCount() > 0"
                      class="text-[10px] uppercase px-2 py-0.5 rounded bg-red-500/10 border border-red-500/40 text-red-300 font-black">
                  {{ 'leadDetail.escalationRequired' | translate }}
                </span>
                <span *ngIf="getEscalationCount() === 0"
                      class="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-black">
                  {{ 'leadDetail.noEscalation' | translate }}
                </span>
              </div>
              <p class="text-[11px] text-slate-300">
                {{ 'leadDetail.nonCompliantCalls' | translate }}: <span class="font-semibold">{{ getNonCompliantCount() }}</span>
              </p>
              <p class="text-[11px] text-slate-300">
                {{ 'leadDetail.totalViolations' | translate }}: <span class="font-semibold">{{ getTotalViolationCount() }}</span>
              </p>
            </div>
          </section>

          <!-- Interaction Table -->
          <div class="bg-[#1b2a3a]/40 rounded-lg overflow-hidden border border-slate-800">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[1120px] text-left text-xs">
                 <thead>
                   <tr class="text-white uppercase tracking-tight font-bold bg-[#1b2a3a]">
                       <th class="px-4 py-3">{{ 'leadDetail.customer' | translate }}</th>
                       <th class="px-4 py-3">{{ 'leadDetail.agentName' | translate }}</th>
                       <th class="px-4 py-3">{{ 'leadDetail.date' | translate }}</th>
                       <th class="px-4 py-3 text-center">{{ 'leadDetail.duration' | translate }}</th>
                       <th class="px-4 py-3 text-center">{{ 'leadDetail.sentiment' | translate }}</th>
                       <th class="px-4 py-3 text-center">{{ 'leadDetail.callType' | translate }}</th>
                       <th class="px-4 py-3 text-center">{{ 'leadDetail.outcome' | translate }}</th>
                       <th class="px-4 py-3 text-center">{{ 'leadDetail.conversion' | translate }}</th>
                       <th class="px-4 py-3 text-center">{{ 'leadDetail.risk' | translate }}</th>
                       <th class="px-4 py-3 text-center">{{ 'leadDetail.compliance' | translate }}</th>
                       <th class="px-4 py-3 text-center">{{ 'leadDetail.fraudPct' | translate }}</th>
                       <th class="px-4 py-3">{{ 'leadDetail.actions' | translate }}</th>
                   </tr>
                 </thead>
                 <tbody class="divide-y divide-slate-800/50">
                   <tr *ngFor="let call of getFilteredCalls()" class="hover:bg-emerald-900/10 transition-colors group">
                       <td class="px-4 py-4">
                          <div class="font-bold text-white">{{ lead?.customerName }}</div>
                          <div *ngIf="lead?.customerNameAr" dir="auto" class="text-[10px] text-white/50 mt-0.5 truncate max-w-[220px]" [title]="lead?.customerNameAr">
                            {{ lead?.customerNameAr }}
                          </div>
                          <ng-container *ngIf="lead as l">
                            <ng-container *ngIf="l.customerPhone as phone">
                              <div *ngIf="!isEncryptedPhone(phone)" class="text-[10px] text-white/40 tracking-wider"># {{ phone }}</div>
                              <div *ngIf="isEncryptedPhone(phone)" class="text-[10px] text-white/40 tracking-wider italic">Phone: [Encrypted]</div>
                            </ng-container>
                          </ng-container>
                       </td>
                       <td class="px-4 py-4">
                          <div class="text-white font-medium truncate max-w-[150px]" [title]="getLocalizedAgentName(call)">
                            {{ getLocalizedAgentName(call) }}
                          </div>
                          <div *ngIf="getLocalizedAgentRole(call)" class="text-[10px] text-white/40 italic" dir="auto">{{ getLocalizedAgentRole(call) }}</div>
                       </td>
                       <td class="px-4 py-4 text-white text-center">{{ call.timestamp | date:'d MMM, yyyy, h:mm a' }}</td>
                       <td class="px-4 py-4 text-white text-center font-mono">{{ formatDurationTable(call.duration) }}</td>
                       <td class="px-4 py-4 text-center">
                          <div class="flex flex-col items-center gap-1">
                              <span [ngClass]="{
                                  'bg-green-500/20 text-green-400': call.analysis?.sentiment === 'POSITIVE',
                                  'bg-red-500/20 text-red-400': call.analysis?.sentiment === 'NEGATIVE',
                                  'bg-yellow-500/20 text-yellow-400': call.analysis?.sentiment === 'NEUTRAL'
                              }" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/5">
                                  {{ getSentimentLabel(call) }}
                              </span>
                          </div>
                       </td>
                       <td class="px-4 py-4 text-center">
                          <span class="text-white/80 font-medium px-2 py-1 bg-slate-800/50 rounded border border-slate-700">
                              {{ getCallTypeLabel(call) }}
                          </span>
                          <div *ngIf="call.analysis?.callTypeAr" class="text-[10px] text-white/50 mt-0.5" dir="rtl">{{ call.analysis?.callTypeAr }}</div>
                       </td>
                       <td class="px-4 py-4 text-center">
                          <div *ngIf="call.analysis?.wasDealClosed" class="flex items-center justify-center gap-1.5 text-green-400 font-bold">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <span class="text-[10px] uppercase">{{ 'leadDetail.closed' | translate }}</span>
                          </div>
                          <div *ngIf="!call.analysis?.wasDealClosed" class="text-white/30 text-[10px] uppercase">{{ 'leadDetail.inProgress' | translate }}</div>
                       </td>
                       <td class="px-4 py-4 text-center">
                           <div class="flex items-center justify-center gap-1">
                              <span class="font-bold" [ngClass]="(call.analysis?.score || 0) >= 70 ? 'text-green-500' : 'text-yellow-500'">
                                  {{ call.analysis?.score || 0 }}%
                              </span>
                           </div>
                       </td>
                       <td class="px-4 py-4 text-center">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                                [ngClass]="{
                                  'bg-emerald-500/10 text-emerald-300 border-emerald-500/30': getRiskLevel(call) === 'LOW',
                                  'bg-amber-500/10 text-amber-300 border-amber-500/30': getRiskLevel(call) === 'MEDIUM',
                                  'bg-red-500/10 text-red-300 border-red-500/30': getRiskLevel(call) === 'HIGH'
                                }">
                            {{ getRiskLevel(call) }}
                          </span>
                          <div class="text-[10px] text-white/40 mt-1 font-mono">{{ getRiskScore(call) }}/100</div>
                       </td>
                       <td class="px-4 py-4 text-center">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                                [ngClass]="getComplianceBadgeClasses(getComplianceStatus(call))">
                            {{ getComplianceStatusLabel(getComplianceStatus(call)) }}
                          </span>
                       </td>
                       <td class="px-4 py-4 text-center">
                          <span class="font-bold"
                                [ngClass]="getFraudProbabilityPercent(call) >= 70 ? 'text-red-300' : getFraudProbabilityPercent(call) >= 40 ? 'text-amber-300' : 'text-emerald-300'">
                            {{ getFraudProbabilityPercent(call) }}%
                          </span>
                       </td>
                       <td class="px-4 py-4">
                           <div class="flex items-center gap-2">
                               <button (click)="viewCall.emit(call)" class="p-1.5 bg-[#0a2e2e] text-green-500 rounded hover:bg-green-500 transition-all hover:text-white border border-green-500/30" title="View Details">
                                   <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                   </svg>
                               </button>
                               <button (click)="downloadPdf.emit(call)" class="p-1.5 bg-yellow-900/20 text-yellow-500 rounded hover:bg-yellow-500 transition-all hover:text-white border border-yellow-500/30" title="Download PDF">
                                   <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                   </svg>
                               </button>
                           </div>
                       </td>
                   </tr>
                 </tbody>
              </table>
            </div>
          </div>

          <!-- Empty State for History -->
          <div *ngIf="getFilteredCalls().length === 0" class="py-12 flex flex-col items-center text-center">
              <div class="w-16 h-16 rounded-2xl bg-slate-800 border border-[#334155] flex items-center justify-center text-slate-500 mb-4">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                  </svg>
              </div>
              <h4 class="text-white font-bold mb-1">No interactions yet</h4>
              <p class="text-slate-500 text-xs">Be the first to upload a recording for this lead.</p>
          </div>

          <div class="flex justify-end pt-4 border-t border-slate-800">
              <button 
                (click)="addInteraction.emit(lead!)"
                class="px-6 py-2 bg-[#0a664e] text-white rounded text-sm font-bold hover:bg-[#085340] transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                {{ 'callAnalysis.addInteraction' | translate }}
              </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LeadDetailsModalComponent {
    @Input() lead: Lead | null = null;
    @Input() complianceScore = '0';
    @Input() avgScore = '0';

    @Output() modalClose = new EventEmitter<void>();
    @Output() viewCall = new EventEmitter<Call>();
    @Output() downloadPdf = new EventEmitter<Call>();
    @Output() addInteraction = new EventEmitter<Lead>();

    constructor(
        private readonly authService: AuthService,
        private readonly translationService: TranslationService
    ) {}

    getComplianceStatusLabel(status: ComplianceStatus): string {
        const key = status === 'COMPLIANT' ? 'leadDetail.compliant' : status === 'RISKY' ? 'leadDetail.risky' : status === 'HIGH_RISK' ? 'leadDetail.highRiskLabel' : status;
        return this.translationService.translate(key);
    }

    getSentimentLabel(call: Call): string {
        const sentiment = call.analysis?.sentiment || 'NEUTRAL';
        const ar = (call.analysis as any)?.sentimentAr;
        if (ar && this.translationService.getCurrentLanguage() === 'ar') return ar;
        return this.translationService.translate(sentiment === 'POSITIVE' ? 'leadDetail.positive' : sentiment === 'NEGATIVE' ? 'leadDetail.negative' : 'leadDetail.neutral');
    }

    getCallTypeLabel(call: Call): string {
        const type = call.analysis?.callType || 'Discovery';
        const ar = (call.analysis as any)?.callTypeAr;
        if (ar && this.translationService.getCurrentLanguage() === 'ar') return ar;
        return type === 'Discovery' ? this.translationService.translate('leadDetail.discovery') : type;
    }

    // ----------------------------
    // Risk / Compliance helpers
    // ----------------------------

    private getQaContribution(qaScore: number): number {
        if (qaScore >= 80) return 10;
        if (qaScore >= 60) return 25;
        return 45;
    }

    private getMifidContribution(mifidStatus: unknown): number {
        if (mifidStatus === 'NON_COMPLIANT') return 30;
        if (mifidStatus === 'PARTIAL') return 15;
        return 0;
    }

    getRiskScore(call: Call): number {
        const a: any = call.analysis;
        if (!a) return 0;

        const qaScore = typeof a.score === 'number' ? a.score : 50;
        const qaContribution = this.getQaContribution(qaScore);

        const mifidStatus: string | undefined = a.mifidCompliance?.overallStatus;
        const mifidContribution = this.getMifidContribution(mifidStatus);

        const hasSuitability = a.suitabilityScore !== null && a.suitabilityScore !== undefined;
        const hasBestExecution = a.bestExecutionCheck === true;
        const hasCategorization = a.clientCategory !== null && a.clientCategory !== undefined;
        const missingMifidContribution =
            (Number(!hasSuitability) * 10) +
            (Number(!hasBestExecution) * 10) +
            (Number(!hasCategorization) * 5);

        const misconductContribution =
            (Number(a.misSellingDetected === true) * 15) +
            (Number(a.falsePromiseDetected === true) * 10) +
            (Number(a.harassmentDetected === true) * 15) +
            (Number(a.repeatedCallPatternDetected === true) * 10);

        const fraudProbability = typeof a.fraudProbability === 'number' ? a.fraudProbability : 0; // 0–1
        const riskyTone = typeof a.riskyToneScore === 'number' ? a.riskyToneScore : 0; // 0–1
        const probabilisticContribution = (fraudProbability * 40) + (riskyTone * 20);

        const escalationContribution = Number(a.escalationRequired === true) * 20;

        const score =
            qaContribution +
            mifidContribution +
            missingMifidContribution +
            misconductContribution +
            probabilisticContribution +
            escalationContribution;

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    getRiskLevel(call: Call): RiskLevel {
        const score = this.getRiskScore(call);
        if (score < 34) return 'LOW';
        if (score < 67) return 'MEDIUM';
        return 'HIGH';
    }

    getComplianceStatus(call: Call): ComplianceStatus {
        const a: any = call.analysis;
        if (!a) return 'RISKY';

        const fraudProbability = typeof a.fraudProbability === 'number' ? a.fraudProbability : 0;
        const misSelling = a.misSellingDetected === true;
        const harassment = a.harassmentDetected === true;
        const falsePromise = a.falsePromiseDetected === true;
        const escalation = a.escalationRequired === true || a.mifidCompliance?.overallStatus === 'NON_COMPLIANT';
        const riskScore = this.getRiskScore(call);

        if (fraudProbability >= 0.7 || (misSelling && harassment) || escalation) return 'FRAUD_ALERT';
        if (riskScore >= 67 || misSelling || falsePromise) return 'HIGH_RISK';
        if (riskScore >= 40) return 'RISKY';
        return 'COMPLIANT';
    }

    getComplianceBadgeClasses(status: ComplianceStatus): string {
        if (status === 'COMPLIANT') return 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300';
        if (status === 'RISKY') return 'bg-amber-500/10 border border-amber-500/40 text-amber-300';
        if (status === 'HIGH_RISK') return 'bg-red-500/10 border border-red-500/40 text-red-300';
        return 'bg-rose-600/15 border border-rose-500/60 text-rose-200';
    }

    getFraudProbabilityPercent(call: Call): number {
        const a: any = call.analysis;
        const value = a?.fraudProbability;
        if (typeof value === 'number') return Math.round(value * 100);

        const misSelling = a?.misSellingDetected === true;
        const harassment = a?.harassmentDetected === true;
        const falsePromise = a?.falsePromiseDetected === true;
        const escalated = a?.escalationRequired === true || a?.mifidCompliance?.overallStatus === 'NON_COMPLIANT';
        const flags = [misSelling, harassment, falsePromise, escalated].filter(Boolean).length;
        if (flags === 0) return 5;
        if (flags === 1) return 30;
        if (flags === 2) return 55;
        return 80;
    }

    // ----------------------------
    // Aggregates for header cards
    // ----------------------------

    getHighRiskCount(): number {
        return this.getFilteredCalls().filter(c => {
            const s = this.getComplianceStatus(c);
            return s === 'HIGH_RISK' || s === 'FRAUD_ALERT';
        }).length;
    }

    getFraudAlertCount(): number {
        return this.getFilteredCalls().filter(c => this.getComplianceStatus(c) === 'FRAUD_ALERT').length;
    }

    getEscalationCount(): number {
        return this.getFilteredCalls().filter(c => {
            const a: any = c.analysis;
            return a?.escalationRequired === true || a?.mifidCompliance?.overallStatus === 'NON_COMPLIANT';
        }).length;
    }

    getNonCompliantCount(): number {
        return this.getFilteredCalls().filter(c => (c as any).analysis?.mifidCompliance?.overallStatus === 'NON_COMPLIANT').length;
    }

    getTotalViolationCount(): number {
        return this.getFilteredCalls().reduce((acc, c) => {
            const v = (c as any).analysis?.mifidCompliance?.violations;
            return acc + (Array.isArray(v) ? v.length : 0);
        }, 0);
    }

    getOverallComplianceStatus(): ComplianceStatus {
        if (this.getFraudAlertCount() > 0) return 'FRAUD_ALERT';
        if (this.getHighRiskCount() > 0) return 'HIGH_RISK';
        const anyRisky = this.getFilteredCalls().some(c => this.getComplianceStatus(c) === 'RISKY');
        return anyRisky ? 'RISKY' : 'COMPLIANT';
    }

    getOverallFraudProbabilityPercent(): number {
        const calls = this.getFilteredCalls();
        if (calls.length === 0) return 5;
        return Math.max(...calls.map(c => this.getFraudProbabilityPercent(c)));
    }

    getOverallRiskyToneDisplay(): string {
        const calls = this.getFilteredCalls();
        const max = calls.reduce((acc, c) => {
            const v = (c as any).analysis?.riskyToneScore;
            if (typeof v !== 'number') return acc;
            return Math.max(acc, v);
        }, -1);
        if (max < 0) return 'N/A';
        return `${Math.round(max * 100)}%`;
    }

    /**
     * Filter calls based on user role
     * Agents should only see their own calls
     */
    getFilteredCalls(): Call[] {
        if (!this.lead?.calls) return [];
        
        const user: any = this.authService.getUser();
        if (!user) return this.lead.calls;
        
        const userRole = user.role?.name || user.role || '';
        const isAgent = userRole === 'Agent' || userRole.toLowerCase() === 'agent';
        
        // If user is an agent, filter calls by their name
        if (isAgent) {
            const userName = user.name || user.email;
            return this.lead.calls.filter(call => call.agentName === userName);
        }
        
        // For non-agents, return all calls
        return this.lead.calls;
    }

    formatDurationTable(seconds: number): string {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    getAgentDisplayName(name: string | null | undefined): string {
        if (!name) return 'Unknown Agent';
        if (name.startsWith('uploads/') || name.includes('/') || name.length > 50) {
            return 'AI System / Unknown';
        }
        return name;
    }

    getLocalizedAgentName(call: Call): string {
      const englishName = this.getAgentDisplayName(call.agentName);
      const arabicName = (call.agentNameAr || '').trim();

      if (this.translationService.getCurrentLanguage() === 'ar') {
        return arabicName || englishName;
      }

      return englishName || arabicName;
    }

    getLocalizedAgentRole(call: Call): string {
      const englishRole = (call.analysis?.agentDetails?.role || '').trim();
      const arabicRole = (call.analysis?.agentDetailsAr?.role || '').trim();

      if (this.translationService.getCurrentLanguage() === 'ar') {
        return arabicRole || englishRole;
      }

      return englishRole || arabicRole;
    }

    /**
     * Check if a phone number is encrypted (AES-GCM format: IV:ciphertext:tag)
     * Encrypted values contain colons and base64-like strings
     */
    isEncryptedPhone(phone: string | null | undefined): boolean {
        if (!phone) return false;
        // Encrypted phone numbers have the format: base64:base64:base64 (IV:ciphertext:tag)
        // They contain colons and base64 characters
        return phone.includes(':') && phone.split(':').length >= 2 && /^[A-Za-z0-9+/=:]+$/.test(phone);
    }
}
