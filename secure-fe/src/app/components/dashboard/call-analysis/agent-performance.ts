import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-agent-performance',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
          <h2 class="text-white font-bold text-lg flex items-center gap-2">
              <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              Agent Performance Benchmarking
          </h2>
          <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Updated real-time</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div *ngFor="let agent of agentPerformance.slice(0, 3); let i = index" 
               class="bg-[#1e293b] rounded-xl p-5 border border-[#334155] relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div class="absolute top-0 right-0 p-2">
                  <span class="text-4xl font-black text-white/5 italic">#{{i+1}}</span>
              </div>
              <div class="flex items-center gap-4 mb-4 relative">
                  <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border-2 border-emerald-500/20 group-hover:border-emerald-500/50 transition-all font-bold text-emerald-400">
                      {{ getAgentDisplayName(agent.name).charAt(0) }}
                  </div>
                  <div class="overflow-hidden">
                      <h4 class="text-white font-bold truncate pr-6" [title]="getAgentDisplayName(agent.name)">
                          {{ getAgentDisplayName(agent.name) }}
                      </h4>
                      <p class="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{{ agent.totalCalls }} Total Interactions</p>
                  </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                  <div class="bg-black/20 p-3 rounded-lg border border-white/5">
                      <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Closing Rate</p>
                      <p class="text-xl font-black text-green-400">{{ agent.closingRate }}%</p>
                  </div>
                  <div class="bg-black/20 p-3 rounded-lg border border-white/5">
                      <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Avg Score</p>
                      <p class="text-xl font-black text-emerald-400">{{ agent.avgScore }}%</p>
                  </div>
              </div>
              <!-- Mini Sentiment Bar -->
              <div class="mt-4 h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
                  <div [style.width.%]="(agent.sentimentBreakdown.POSITIVE / agent.totalCalls) * 100" class="bg-green-500"></div>
                  <div [style.width.%]="(agent.sentimentBreakdown.NEUTRAL / agent.totalCalls) * 100" class="bg-yellow-500"></div>
                  <div [style.width.%]="(agent.sentimentBreakdown.NEGATIVE / agent.totalCalls) * 100" class="bg-red-500"></div>
              </div>
          </div>
      </div>
    </div>
  `
})
export class AgentPerformanceComponent {
    @Input() agentPerformance: any[] = [];

    getAgentDisplayName(name: string | null | undefined): string {
        if (!name) return 'Unknown Agent';
        if (name.startsWith('uploads/') || name.includes('/') || name.length > 50) {
            return 'AI System / Unknown';
        }
        return name;
    }
}
