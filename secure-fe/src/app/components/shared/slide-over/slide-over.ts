import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slide-over',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex justify-end" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 transition-opacity" (click)="close.emit()"></div>

      <!-- Panel -->
      <div class="relative w-screen max-w-md bg-[#1e293b] shadow-xl flex flex-col h-full border-l border-[#334155] transform transition-transform duration-300 ease-in-out">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-[#334155] flex items-center justify-between bg-[#0f172a]">
          <h2 class="text-lg font-medium text-white" id="slide-over-title">{{ title }}</h2>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white">
            <span class="sr-only">Close panel</span>
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 relative">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SlideOverComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();
}
