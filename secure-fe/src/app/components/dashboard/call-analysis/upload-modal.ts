import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-upload-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[100] flex justify-end">
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div class="bg-[#1e293b] border-l border-[#334155] w-full max-w-2xl h-full overflow-hidden relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <!-- Modal Header -->
        <div class="p-6 border-b border-[#334155] flex justify-between items-center bg-[#1e293b]">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
            </span>
            Upload Audio Recording
          </h2>
          <button (click)="modalClose.emit()" class="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-8 space-y-6 overflow-y-auto flex-1">
          <!-- Customer Metadata -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Customer Name</label>
                  <input
                      type="text"
                      [(ngModel)]="metadata.customerName"
                      [disabled]="!!metadata.leadId"
                      placeholder="e.g. John Doe"
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
              </div>
              <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Customer Name (Arabic)</label>
                  <input
                      type="text"
                      [(ngModel)]="metadata.customerNameAr"
                      dir="auto"
                      [disabled]="!!metadata.leadId"
                      placeholder="مثال: أحمد"
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
              </div>
              <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Customer Number (Optional)</label>
                  <input
                      type="text"
                      [(ngModel)]="metadata.customerNumber"
                      placeholder="+91 XXXXX XXXXX"
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
              </div>
          </div>


          <!-- Drag and Drop Area -->
          <div
              class="relative"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
          >
              <div
                  [ngClass]="{
                      'border-blue-500 bg-blue-500/10': isDragging,
                      'border-slate-700 bg-slate-900/50': !isDragging,
                      'border-green-500 bg-green-500/5': selectedFiles.length > 0 && !isDragging
                  }"
                  class="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                  (click)="uInput.click()"
              >
                  <input #uInput type="file" class="hidden" accept="audio/*,.mp3,.wav,.m4a" multiple (change)="onFileSelected($event)">

                  <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg *ngIf="selectedFiles.length === 0" class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                      </svg>
                      <svg *ngIf="selectedFiles.length > 0" class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                  </div>

                  <p *ngIf="selectedFiles.length === 0" class="text-sm text-slate-300 font-medium">Drag and drop audio here, or <span class="text-blue-500">browse</span></p>
                  <p *ngIf="selectedFiles.length > 0" class="text-sm text-green-400 font-bold">{{ selectedFiles.length }} files selected</p>
                  <p class="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">MP3, WAV, M4A supported</p>
              </div>
          </div>

          <!-- Staged Files List -->
          <div *ngIf="selectedFiles.length > 0 && !isUploading" class="space-y-3">
              <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-3">
                      <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Staged Files</h3>
                      <span class="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">{{ getTotalSize() }} MB total</span>
                  </div>
                  <button (click)="clearFiles.emit()" class="text-[11px] text-red-500 hover:text-red-400 font-bold uppercase transition-colors px-2 py-1 hover:bg-red-500/10 rounded">Clear All</button>
              </div>
              <div class="max-h-80 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                  <div *ngFor="let file of selectedFiles; let i = index" class="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl group transition-all hover:bg-slate-800/70 hover:border-slate-600 shadow-sm">
                      <div class="flex items-start justify-between gap-3 mb-3">
                          <div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                                  <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                                  </svg>
                              </div>
                              <div class="overflow-hidden flex-1 min-w-0">
                                  <p class="text-sm text-white font-semibold truncate mb-1" [title]="file.name">{{ file.name }}</p>
                                  <p class="text-[11px] text-slate-400 font-medium">{{ (file.size / 1024 / 1024) | number:'1.1-1' }} MB</p>
                              </div>
                          </div>
                          <button (click)="fileRemoved.emit(i)" class="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                          </button>
                      </div>
                      <!-- Agent Selection per File -->
                      <div class="space-y-2 pt-2 border-t border-slate-700/50">
                          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent (Optional)</label>
                          <select
                              [(ngModel)]="fileAgents[i]"
                              (change)="onAgentChange(i, $event)"
                              class="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                          >
                              <option [value]="null">Auto-detect from call</option>
                              <option *ngFor="let agent of agents" [value]="agent.id">
                                  {{ agent.name || agent.email }}<span *ngIf="agent.team"> ({{ agent.team.name }})</span>
                              </option>
                          </select>
                          <p class="text-[9px] text-slate-500 italic">Leave unselected to auto-detect agent from call</p>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Upload Progress -->
          <div *ngIf="isUploading" class="space-y-4">
              <div class="flex items-center gap-3 p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                  <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <p class="text-xs text-blue-300 font-medium">
                      {{ progress.current <= progress.total ? 'Analyzing call ' + progress.current + ' of ' + progress.total + '...' : 'Finalizing batch...' }}
                  </p>
              </div>
              <!-- Mini Error Log -->
              <div *ngIf="errors.length > 0" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p class="text-[10px] text-red-500 font-bold uppercase mb-1">Upload Warnings:</p>
                  <ul class="text-[10px] text-red-400 space-y-1">
                      <li *ngFor="let err of errors">• {{ err }}</li>
                  </ul>
              </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 border-t border-[#334155] flex justify-end gap-3 bg-[#1e293b]">
          <button (click)="isUploading ? cancelUploadClicked.emit() : modalClose.emit()" class="px-6 py-2 bg-slate-800 text-slate-300 rounded-md text-sm font-medium hover:text-white transition-colors">
            {{ isUploading ? 'Stop & Close' : 'Cancel' }}
          </button>
          <button
              (click)="upload.emit()"
              [disabled]="selectedFiles.length === 0 || !metadata.customerName || isUploading"
              class="px-8 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {{ isUploading ? ('Analyzing Call ' + progress.current + ' of ' + progress.total + '...') : 'Start Batch Analysis' }}
            <svg *ngIf="!isUploading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
            </svg>
            <svg *ngIf="isUploading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
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
export class UploadModalComponent {
  @Input() metadata: any = {};
  @Input() selectedFiles: File[] = [];
  @Input() isUploading = false;
  @Input() progress = { current: 0, total: 0 };
  @Input() errors: string[] = [];
  @Input() isDragging = false;
  @Input() agents: any[] = [];
  @Input() fileAgents: (number | null)[] = [];

  @Output() modalClose = new EventEmitter<void>();
  @Output() cancelUploadClicked = new EventEmitter<void>();
  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() fileRemoved = new EventEmitter<number>();
  @Output() clearFiles = new EventEmitter<void>();
  @Output() upload = new EventEmitter<void>();
  @Output() draggingChanged = new EventEmitter<boolean>();
  @Output() agentChanged = new EventEmitter<{ index: number; agentId: number | null }>();

  @ViewChild('uInput') uInput!: ElementRef;

  onAgentChange(index: number, event: any): void {
    const agentId = event.target.value === 'null' || event.target.value === '' ? null : Number.parseInt(event.target.value);
    this.agentChanged.emit({ index, agentId });
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.filesSelected.emit(Array.from(files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.draggingChanged.emit(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.draggingChanged.emit(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.draggingChanged.emit(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.filesSelected.emit(Array.from(files));
    }
  }

  getTotalSize(): string {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      return '0.0';
    }
    const totalBytes = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
    return (totalBytes / 1024 / 1024).toFixed(1);
  }
}
