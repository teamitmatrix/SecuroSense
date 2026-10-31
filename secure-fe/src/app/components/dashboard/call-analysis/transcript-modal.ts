import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Call } from '../../../models/models';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-transcript-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="fixed inset-0 z-[110] flex justify-end">
      <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      
      <div class="bg-[#1e293b] border-l border-[#334155] w-full max-w-2xl h-full overflow-hidden relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <!-- Modal Header -->
        <div class="p-6 border-b border-[#334155] flex justify-between items-center bg-[#1e293b]">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-3">
              {{ 'transcript.fullTranscript' | translate }}
              <span class="text-[10px] uppercase px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold">
                {{ call?.customerName }}
              </span>
            </h2>
            <p *ngIf="call?.customerNameAr" class="text-[10px] text-slate-400 mt-0.5" dir="rtl">{{ call?.customerNameAr }}</p>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Scrollable Transcript -->
        <div class="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-900/40">
            <!-- Arabic-only view -->
            <ng-container *ngIf="language === 'ar'">
              <p *ngIf="getTranscriptLinesAr().length === 0" class="text-slate-400 text-center py-8">{{ 'transcript.arabicNotAvailable' | translate }}</p>
              <div *ngFor="let line of getTranscriptLinesAr(); let i = index" class="flex flex-col">
                <ng-container *ngIf="isSpeakerLineAr(line)">
                  <div [ngClass]="isAgentLineAr(line) ? 'items-end ml-auto' : 'items-start mr-auto'" class="flex flex-col max-w-[85%] mb-2">
                    <div class="flex items-center gap-2 mb-1 px-1">
                      <span [ngClass]="isAgentLineAr(line) ? 'text-emerald-400' : 'text-teal-400'" class="text-[10px] uppercase font-black tracking-wider" dir="rtl">{{ getSpeakerLabelAr(line) }}</span>
                      <span class="text-[9px] text-slate-600 font-mono">L{{ i + 1 }}</span>
                    </div>
                    <div [ngClass]="isAgentLineAr(line) ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-50 rounded-tr-none' : 'bg-slate-800/80 border-slate-700 text-slate-200 rounded-tl-none'"
                         class="px-4 py-3 rounded-2xl border text-sm shadow-lg shadow-black/20 leading-relaxed" dir="rtl">
                      {{ getSpeakerTextAr(line) }}
                    </div>
                  </div>
                </ng-container>
                <ng-container *ngIf="!isSpeakerLineAr(line)">
                  <div class="text-[11px] text-slate-500 italic py-2 px-4 border-l-2 border-slate-700 bg-slate-800/20 my-2 rounded-r" dir="rtl">{{ line }}</div>
                </ng-container>
              </div>
            </ng-container>
            <!-- English view (with optional Arabic below each line) -->
            <ng-container *ngIf="language === 'en'">
              <div *ngFor="let line of getTranscriptLines(); let i = index" class="flex flex-col">
                <ng-container *ngIf="isSpeakerLine(line)">
                  <div [ngClass]="getSpeaker(line).toLowerCase() === 'agent' ? 'items-end ml-auto' : 'items-start mr-auto'" class="flex flex-col max-w-[85%] mb-2">
                    <div class="flex items-center gap-2 mb-1 px-1">
                      <span [ngClass]="getSpeaker(line).toLowerCase() === 'agent' ? 'text-emerald-400' : 'text-teal-400'" class="text-[10px] uppercase font-black tracking-wider">{{ getSpeakerLabel(line) | translate }}</span>
                      <span class="text-[9px] text-slate-600 font-mono">L{{ i + 1 }}</span>
                    </div>
                    <div [ngClass]="getSpeaker(line).toLowerCase() === 'agent' ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-50 rounded-tr-none' : 'bg-slate-800/80 border-slate-700 text-slate-200 rounded-tl-none'"
                         class="px-4 py-3 rounded-2xl border text-sm shadow-lg shadow-black/20 leading-relaxed">
                      {{ getSpeakerText(line) }}
                    </div>
                    <p *ngIf="getTranscriptLineAr(i)" class="text-xs text-slate-400 mt-1.5 px-1" dir="rtl">{{ getTranscriptLineAr(i) }}</p>
                  </div>
                </ng-container>
                <ng-container *ngIf="!isSpeakerLine(line)">
                  <div class="text-[11px] text-slate-500 italic py-2 px-4 border-l-2 border-slate-700 bg-slate-800/20 my-2 rounded-r">{{ line }}</div>
                  <p *ngIf="getTranscriptLineAr(i)" class="text-[10px] text-slate-500 italic py-1 px-4 mt-0.5" dir="rtl">{{ getTranscriptLineAr(i) }}</p>
                </ng-container>
              </div>
            </ng-container>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-[#334155] flex justify-end bg-[#1e293b]">
          <button (click)="close.emit()" class="px-8 py-2 bg-slate-700 text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-slate-600 transition-all">
            {{ 'transcript.dismiss' | translate }}
          </button>
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
export class TranscriptModalComponent {
  @Input() call: Call | null = null;
  @Input() language: 'en' | 'ar' = 'en';
  @Output() close = new EventEmitter<void>();

  getTranscriptLines(): string[] {
    if (!this.call?.transcript) return [];
    return this.call.transcript.split('\n').filter(line => line.trim() !== '');
  }

  getTranscriptLinesAr(): string[] {
    const ar = this.call?.transcriptAr;
    if (!ar || typeof ar !== 'string') return [];
    return ar.split('\n').filter((l: string) => l.trim() !== '');
  }

  getTranscriptLineAr(index: number): string | null {
    const lines = this.getTranscriptLinesAr();
    return lines[index]?.trim() || null;
  }

  isSpeakerLine(line: string): boolean {
    return /^(Customer|Agent|Caller|Replier|Person \d+|Speaker_\w+):/i.test(line);
  }

  getSpeaker(line: string): string {
    const match = line.match(/^(Customer|Agent|Caller|Replier|Person \d+|Speaker_\w+):/i);
    return match ? match[1] : '';
  }

  getSpeakerLabel(line: string): string {
    const speaker = this.getSpeaker(line).toLowerCase();
    if (speaker === 'agent') return 'transcript.agent';
    if (speaker === 'customer' || speaker === 'caller') return 'transcript.customer';
    return this.getSpeaker(line);
  }

  getSpeakerText(line: string): string {
    const match = line.match(/^(Customer|Agent|Caller|Replier|Person \d+|Speaker_\w+):(.*)/i);
    return match ? match[2].trim() : line;
  }

  /** Arabic transcript: match "Customer:" or "Agent:" or "العميل:" or "الموظف:" style lines */
  isSpeakerLineAr(line: string): boolean {
    return /^(Customer|Agent|Caller|Replier|العميل|الموظف|Person \d+|Speaker_\w+):/i.test(line.trim());
  }

  isAgentLineAr(line: string): boolean {
    const lower = line.trim().toLowerCase();
    return lower.startsWith('agent:') || line.trim().startsWith('الموظف:');
  }

  getSpeakerLabelAr(line: string): string {
    const trimmed = line.trim();
    if (/^Agent:/i.test(trimmed) || trimmed.startsWith('الموظف:')) return 'الموظف';
    if (/^Customer:/i.test(trimmed) || /^Caller:/i.test(trimmed) || trimmed.startsWith('العميل:')) return 'العميل';
    return trimmed.split(':')[0] || '';
  }

  getSpeakerTextAr(line: string): string {
    const colonIndex = line.indexOf(':');
    return colonIndex >= 0 ? line.slice(colonIndex + 1).trim() : line;
  }
}
