// src/app/components/dashboard/compliance-dashboard/compliance-dashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceService, ComplianceReport } from '../../../services/compliance.service';

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 h-full overflow-y-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-semibold text-white mb-1">MiFID Compliance Dashboard</h1>
        <p class="text-slate-400 text-sm">Monitor and manage regulatory compliance for your organization</p>
      </div>

      <!-- Date Range Selector -->
      <div class="mb-6 flex gap-4 items-end">
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Start Date</label>
          <input 
            type="date" 
            [(ngModel)]="startDate" 
            class="bg-[#1e293b] border border-[#334155] text-white rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase mb-2">End Date</label>
          <input 
            type="date" 
            [(ngModel)]="endDate" 
            class="bg-[#1e293b] border border-[#334155] text-white rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button 
          (click)="generateReport()"
          [disabled]="isLoading"
          class="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg *ngIf="isLoading" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Generate Report
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <!-- Report Results -->
      <div *ngIf="report && !isLoading" class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold text-slate-400 uppercase">Total Calls</h3>
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </div>
            <p class="text-3xl font-bold text-white">{{ report.summary.totalCalls }}</p>
          </div>

          <div class="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold text-slate-400 uppercase">Compliant Calls</h3>
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p class="text-3xl font-bold text-green-400">{{ report.summary.compliantCalls }}</p>
          </div>

          <div class="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold text-slate-400 uppercase">Compliance Rate</h3>
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <p class="text-3xl font-bold text-blue-400">{{ report.summary.complianceRate }}%</p>
          </div>
        </div>

        <!-- Compliance Intelligence Snapshot (SecuroSense 2.0) -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Compliance Summary -->
          <div class="bg-slate-800/80 p-5 rounded-xl border border-slate-700 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <p class="text-[11px] font-bold text-slate-200 uppercase tracking-widest">Compliance Summary</p>
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded"
                    [ngClass]="getPostureBadgeClasses()">
                {{ getPostureLabel() }}
              </span>
            </div>
            <div class="space-y-2 text-[11px] text-slate-300">
              <div class="flex justify-between">
                <span class="text-slate-400">Script Adherence</span>
                <span class="font-semibold">{{ getScriptAdherenceDisplay() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Risk Disclosures</span>
                <span class="font-semibold" [ngClass]="getDisclosureStatusClass()">
                  {{ getDisclosureStatusLabel() }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Mis-selling</span>
                <span class="font-semibold text-slate-300">Unknown</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Harassment</span>
                <span class="font-semibold text-slate-300">Unknown</span>
              </div>
            </div>
          </div>

          <!-- Fraud Risk -->
          <div class="bg-slate-800/80 p-5 rounded-xl border border-red-500/30 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <p class="text-[11px] font-bold text-red-300 uppercase tracking-widest flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                Fraud Risk
              </p>
              <span class="text-[11px] font-semibold text-red-200">
                {{ getFraudProbabilityPercent() }}% Probability
              </span>
            </div>
            <p class="text-[11px] text-slate-300">
              Risky tone score: <span class="font-semibold">{{ getRiskyToneDisplay() }}</span>
            </p>
            <p class="text-[11px] text-slate-400 line-clamp-3" *ngIf="getTopFraudPhrase()">
              Key phrase: <span class="text-red-300 font-medium">"{{ getTopFraudPhrase() }}"</span>
            </p>
            <p class="text-[11px] text-slate-500" *ngIf="!getTopFraudPhrase()">
              No explicit fraud phrases detected.
            </p>
          </div>

          <!-- Regulatory Check -->
          <div class="bg-slate-800/80 p-5 rounded-xl border border-blue-500/40 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <p class="text-[11px] font-bold text-blue-300 uppercase tracking-widest">Regulatory Check</p>
              <span *ngIf="getEscalationRequired()"
                    class="text-[10px] uppercase px-2 py-0.5 rounded bg-red-500/10 border border-red-500/40 text-red-300 font-black">
                Escalation Required
              </span>
              <span *ngIf="!getEscalationRequired()"
                    class="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-black">
                No Escalation
              </span>
            </div>
            <p class="text-[11px] text-slate-300">
              Missing disclosures: <span class="font-semibold">{{ getMissingDisclosuresCount() }}</span>
            </p>
            <p class="text-[11px] text-slate-300">
              Violation keywords: <span class="font-semibold">{{ getViolationKeywordsCount() }}</span>
            </p>
          </div>
        </section>

        <!-- Rule Statistics -->
        <div class="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Compliance Rule Statistics</h3>
          <div class="space-y-4">
            <div *ngFor="let rule of getRuleStatistics()" class="border-b border-[#334155] pb-4 last:border-0">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold text-white">{{ rule.name }}</h4>
                <span [ngClass]="{
                  'text-green-400': rule.passRate >= 80,
                  'text-yellow-400': rule.passRate >= 50 && rule.passRate < 80,
                  'text-red-400': rule.passRate < 50
                }" class="text-xs font-bold">
                  {{ rule.passRate }}% Pass Rate
                </span>
              </div>
              <div class="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <span class="text-slate-400">Total:</span>
                  <span class="text-white font-semibold ml-2">{{ rule.total }}</span>
                </div>
                <div>
                  <span class="text-green-400">Pass:</span>
                  <span class="text-white font-semibold ml-2">{{ rule.pass }}</span>
                </div>
                <div>
                  <span class="text-red-400">Fail:</span>
                  <span class="text-white font-semibold ml-2">{{ rule.fail }}</span>
                </div>
                <div>
                  <span class="text-slate-400">N/A:</span>
                  <span class="text-white font-semibold ml-2">{{ rule.na }}</span>
                </div>
              </div>
              <!-- Progress Bar -->
              <div class="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  [ngClass]="{
                    'bg-green-500': rule.passRate >= 80,
                    'bg-yellow-500': rule.passRate >= 50 && rule.passRate < 80,
                    'bg-red-500': rule.passRate < 50
                  }"
                  class="h-full transition-all"
                  [style.width.%]="rule.passRate"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
        {{ errorMessage }}
      </div>

      <!-- Empty State (no report yet, not loading) -->
      <div *ngIf="!report && !isLoading && !errorMessage" class="flex flex-col items-center justify-center py-12">
        <div class="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 5.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        </div>
        <h3 class="text-white font-semibold mb-2">No Compliance Report</h3>
        <p class="text-slate-400 text-sm">Select a date range and generate a compliance report</p>
      </div>
    </div>
  `
})
export class ComplianceDashboardComponent implements OnInit {
  report: ComplianceReport | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  startDate: string;
  endDate: string;

  constructor(
    private readonly complianceService: ComplianceService
  ) {
    // Default to last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Auto-generate report on load
    this.generateReport();
  }

  generateReport(): void {
    this.errorMessage = null;
    this.isLoading = true;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    this.complianceService.generateComplianceReport(start, end).subscribe({
      next: (report: ComplianceReport) => {
        this.report = report;
        this.isLoading = false;
      },
      error: (err: { error?: { error?: string; message?: string }; message?: string }) => {
        console.error('Failed to generate compliance report', err);
        this.isLoading = false;
        const msg = err?.error?.error || err?.error?.message || err?.message;
        this.errorMessage = msg && typeof msg === 'string'
          ? msg
          : 'Failed to load compliance report. Check that you are in an organization and try again.';
      }
    });
  }

  getRuleStatistics(): Array<{
    name: string;
    total: number;
    pass: number;
    fail: number;
    na: number;
    passRate: number;
  }> {
    if (!this.report?.ruleStatistics) return [];
    
    return Object.entries(this.report.ruleStatistics).map(([name, stats]) => ({
      name,
      total: stats.total,
      pass: stats.pass,
      fail: stats.fail,
      na: stats.na,
      passRate: stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0
    }));
  }

  // ==============================
  // SecuroSense 2.0 snapshot helpers
  // ==============================

  getPostureLabel(): string {
    const posture = this.report?.insights?.complianceSummary?.posture;
    if (posture === 'COMPLIANT') return 'Compliant';
    if (posture === 'HIGH_RISK') return 'High Risk';
    if (posture === 'RISKY') return 'Risky';
    // sensible default
    return 'Risky';
  }

  getPostureBadgeClasses(): string {
    const posture = this.report?.insights?.complianceSummary?.posture;
    if (posture === 'COMPLIANT') {
      return 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300';
    }
    if (posture === 'HIGH_RISK') {
      return 'bg-red-500/10 border border-red-500/40 text-red-300';
    }
    return 'bg-amber-500/10 border border-amber-500/40 text-amber-300';
  }

  getScriptAdherenceDisplay(): string {
    const v = this.report?.insights?.complianceSummary?.scriptAdherencePercent;
    if (typeof v === 'number') return `${v}%`;
    return 'N/A';
  }

  getDisclosureStatusLabel(): string {
    return this.report?.insights?.complianceSummary?.riskDisclosures?.statusLabel || 'Unknown';
  }

  getDisclosureStatusClass(): string {
    const status = this.report?.insights?.complianceSummary?.riskDisclosures?.statusLabel;
    if (status === 'Complete') return 'text-emerald-400';
    if (status === 'Missing') return 'text-red-400';
    if (status === 'Partial') return 'text-amber-300';
    return 'text-slate-300';
  }

  getFraudProbabilityPercent(): number {
    const v = this.report?.insights?.fraudRisk?.probabilityPercent;
    return typeof v === 'number' ? v : 5;
  }

  getRiskyToneDisplay(): string {
    const v = this.report?.insights?.fraudRisk?.riskyToneScorePercent;
    if (typeof v === 'number') return `${v}%`;
    return 'N/A';
  }

  getTopFraudPhrase(): string | null {
    return this.report?.insights?.fraudRisk?.topPhrase || null;
  }

  getEscalationRequired(): boolean {
    return this.report?.insights?.regulatoryCheck?.escalationRequired === true;
  }

  getMissingDisclosuresCount(): number {
    const v = this.report?.insights?.regulatoryCheck?.missingDisclosuresCount;
    return typeof v === 'number' ? v : 0;
  }

  getViolationKeywordsCount(): number {
    const v = this.report?.insights?.regulatoryCheck?.violationKeywordsCount;
    return typeof v === 'number' ? v : 0;
  }
}

