import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 h-full overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <h1 class="text-white font-medium">Categories</h1>
        <button class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded transition-colors">
          Create New Categories +
        </button>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let cat of categories" class="bg-[#1e293b] rounded-lg p-4 border border-[#334155] relative group hover:border-emerald-500/50 transition-colors">
          
          <div class="flex justify-between items-start mb-4">
             <div class="flex items-center gap-3">
                 <div class="w-10 h-10 bg-[#334155] rounded-lg flex items-center justify-center text-white font-bold text-lg">8</div>
                 <div>
                     <div class="text-[10px] text-slate-500">Category</div>
                     <h3 class="text-white font-medium">Calling Team</h3>
                 </div>
             </div>
             <button class="text-xs text-slate-500 hover:text-white">Edit</button>
          </div>

          <div>
             <div class="text-[10px] text-slate-500 mb-2">Added Teams</div>
             <div class="flex flex-wrap gap-2">
                 <span class="px-2 py-1 rounded-full border border-slate-600 text-[10px] text-slate-400">Bootcamp Plus</span>
                 <span class="px-2 py-1 rounded-full border border-slate-600 text-[10px] text-slate-400">Auto Funnel</span>
                 <span class="px-2 py-1 rounded-full border border-slate-600 text-[10px] text-slate-400">Incoming</span>
                 <span class="px-2 py-1 rounded-full border border-slate-600 text-[10px] text-slate-400">Priority Leads</span>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CategoryManagementComponent {
  categories = Array(8).fill({});
}
