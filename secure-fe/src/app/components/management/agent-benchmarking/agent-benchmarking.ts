import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallAnalysisService } from '../../../services/call-analysis.service';
import { AgentPerformanceComponent } from '../../dashboard/call-analysis/agent-performance';

@Component({
    selector: 'app-agent-benchmarking',
    standalone: true,
    imports: [CommonModule, AgentPerformanceComponent],
    template: `
    <div class="p-8 h-full overflow-y-auto custom-scrollbar">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-semibold text-white mb-1">Performance Benchmarking</h1>
        <p class="text-slate-400 text-sm italic">Analyze and compare agent performance across all interactions.</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        <div *ngFor="let i of [1,2,3]" class="bg-[#1e293b]/50 h-48 rounded-xl border border-[#334155]"></div>
      </div>

      <!-- Performance Section -->
      <div *ngIf="!isLoading">
          <app-agent-performance [agentPerformance]="agentPerformance"></app-agent-performance>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && agentPerformance.length === 0" class="py-12 flex flex-col items-center justify-center border-2 border-dashed border-[#334155] rounded-3xl bg-slate-800/20">
          <p class="text-slate-500 italic text-sm">No performance data available yet. Start by analyzing some calls.</p>
      </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
  `]
})
export class AgentBenchmarkingComponent implements OnInit {
    agentPerformance: any[] = [];
    isLoading = true;

    constructor(private callAnalysisService: CallAnalysisService) { }

    ngOnInit() {
        this.loadPerformance();
    }

    loadPerformance() {
        this.isLoading = true;
        this.callAnalysisService.getAgentPerformance().subscribe({
            next: (data) => {
                this.agentPerformance = data.sort((a: any, b: any) => b.closingRate - a.closingRate);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading performance stats', err);
                this.isLoading = false;
            }
        });
    }
}
