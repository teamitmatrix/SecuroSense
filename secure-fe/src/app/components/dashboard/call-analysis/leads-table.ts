import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lead } from '../../../models/models';

import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-leads-table',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden shadow-xl" [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      <div class="p-6 border-b border-[#334155] flex justify-between items-center bg-[#1e293b]" [class.flex-row-reverse]="translationService.isRTL()">
        <h3 class="text-white font-medium">{{ 'callAnalysis.leadsTable.title' | translate }}</h3>
        <span class="text-slate-400 text-xs">{{ 'callAnalysis.leadsTable.viewingLeads' | translate:{count: leads.length.toString()} }}</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full" [class.text-left]="!translationService.isRTL()" [class.text-right]="translationService.isRTL()">
          <thead>
            <tr class="text-slate-400 text-[11px] uppercase tracking-wider border-b border-[#334155] bg-slate-800/30">
              <th class="px-6 py-4 font-semibold">{{ 'callAnalysis.leadsTable.customerName' | translate }}</th>
              <th class="px-6 py-4 font-semibold">{{ 'callAnalysis.leadsTable.health' | translate }}</th>
              <th class="px-6 py-4 font-semibold">{{ 'callAnalysis.leadsTable.stage' | translate }}</th>
              <th class="px-6 py-4 font-semibold">{{ 'callAnalysis.leadsTable.lastUpdated' | translate }}</th>
              <th class="px-6 py-4 font-semibold" [class.text-right]="!translationService.isRTL()" [class.text-left]="translationService.isRTL()">{{ 'callAnalysis.leadsTable.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="text-slate-300 text-sm divide-y divide-[#334155]">
              <tr *ngFor="let lead of leads" class="hover:bg-slate-800/50 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="text-white font-bold">{{ lead.customerName || 'Unknown' }}</span>
                    <span *ngIf="lead.customerNameAr" dir="auto" class="text-[11px] text-slate-400 font-medium truncate max-w-[220px]" [title]="lead.customerNameAr">{{ lead.customerNameAr }}</span>
                    <span class="text-[10px] text-slate-500 font-medium">Total calls:{{ lead._count?.calls || 0 }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1">
                      <div *ngFor="let s of getSentimentTrend(lead)"
                           class="w-4 h-4 rounded-sm border border-black/20"
                           [title]="s"
                           [ngClass]="{
                              'bg-green-500': s === 'POSITIVE',
                              'bg-red-500': s === 'NEGATIVE',
                              'bg-yellow-500': s === 'NEUTRAL'
                           }">
                      </div>
                      <span *ngIf="getSentimentTrend(lead).length === 0" class="text-slate-600 text-[10px]">{{ 'callAnalysis.leadsTable.noHistory' | translate }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full" [ngClass]="{
                          'bg-emerald-400': lead.status === 'NEW',
                          'bg-green-400': lead.status === 'CLOSED',
                          'bg-yellow-400': lead.status !== 'NEW' && lead.status !== 'CLOSED'
                      }"></span>
                      <span class="text-slate-300 font-medium italic text-[11px]">
                        {{ lead.status === 'NEW' ? ('callAnalysis.leadsTable.newLead' | translate) : (lead.status === 'CLOSED' ? ('callAnalysis.leadsTable.dealWon' | translate) : ('callAnalysis.leadsTable.inProgress' | translate)) }}
                      </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-400 text-xs">
                  {{ lead.updatedAt | date:'d MMM, yyyy, h:mm a' }}
                </td>
                <td class="px-6 py-4" [class.text-right]="!translationService.isRTL()" [class.text-left]="translationService.isRTL()">
                  <div class="flex gap-2" [class.justify-end]="!translationService.isRTL()" [class.justify-start]="translationService.isRTL()">
                      <button (click)="viewLead.emit(lead)" class="p-2 bg-slate-800 text-slate-400 hover:text-white rounded transition-colors border border-slate-700">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="leads.length === 0 && !isLoading">
                <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                  {{ 'callAnalysis.leadsTable.noLeads' | translate }}
                </td>
              </tr>
              <tr *ngIf="isLoading">
                <td colspan="5" class="px-6 py-12 text-center text-slate-500 italic">
                  {{ 'callAnalysis.leadsTable.fetching' | translate }}
                </td>
              </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div *ngIf="leads.length > 0" class="p-4 border-t border-[#334155] flex items-center justify-between bg-slate-800/20" [class.flex-row-reverse]="translationService.isRTL()">
          <div class="text-xs text-slate-500">
              {{ 'callAnalysis.leadsTable.showing' | translate }} <span class="text-white">{{ (currentPage - 1) * pageSize + 1 }}</span> {{ 'callAnalysis.leadsTable.to' | translate }}
              <span class="text-white">{{ Math.min(currentPage * pageSize, totalItems) }}</span> {{ 'callAnalysis.leadsTable.of' | translate }}
              <span class="text-white">{{ totalItems }}</span> {{ 'dashboard.users' | translate }}
          </div>
          <div class="flex items-center gap-2" [class.flex-row-reverse]="translationService.isRTL()">
              <button
                  (click)="prevPage.emit()"
                  [disabled]="currentPage === 1 || isLoading"
                  class="p-2 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  [class.rotate-180]="translationService.isRTL()"
              >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
              </button>
              <div class="flex items-center gap-1" [class.flex-row-reverse]="translationService.isRTL()">
                  <button
                      *ngFor="let p of pages"
                      (click)="goToPage.emit(p)"
                      [class.bg-emerald-600]="p === currentPage"
                      [class.text-white]="p === currentPage"
                      [class.border-emerald-500]="p === currentPage"
                      class="px-3 py-1 text-xs font-semibold rounded-md border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 transition-all"
                  >
                      {{ p }}
                  </button>
              </div>
              <button
                  (click)="nextPage.emit()"
                  [disabled]="currentPage === totalPages || isLoading"
                  class="p-2 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  [class.rotate-180]="translationService.isRTL()"
              >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
              </button>
          </div>
      </div>
    </div>
  `
})
export class LeadsTableComponent {
  @Input() leads: Lead[] = [];
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalItems = 0;
  @Input() totalPages = 0;
  @Input() pages: number[] = [];

  @Output() viewLead = new EventEmitter<Lead>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() goToPage = new EventEmitter<number>();

  Math = Math;

  constructor(public readonly translationService: TranslationService) {}

  getSentimentTrend(lead: Lead): string[] {
    if (!lead.calls || lead.calls.length === 0) return [];
    const sortedCalls = [...lead.calls].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return sortedCalls.slice(-4).map(c => c.analysis?.sentiment || 'NEUTRAL');
  }
}
