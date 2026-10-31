import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../../services/team.service';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 h-full overflow-y-auto custom-scrollbar">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1">Team Management</h1>
          <p class="text-slate-400 text-sm italic">Organize your agents and scale your operations.</p>
        </div>
        <button 
          (click)="openAddTeamModal()"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-lg shadow-emerald-900/40 active:scale-95"
        >
          Add Team +
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        <div *ngFor="let i of [1,2,3,4]" class="bg-[#1e293b]/50 h-32 rounded-xl border border-[#334155]"></div>
      </div>

      <!-- Grid -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div *ngFor="let team of teams" class="bg-[#1e293b] rounded-xl p-5 border border-[#334155] relative group hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-500/5">
          <div class="flex justify-end items-start mb-4">
            <span class="text-[10px] text-emerald-400 font-black uppercase">{{team._count?.users || 0}} Agents</span>
          </div>
          
          <h3 class="text-white font-bold text-lg mb-6 group-hover:text-emerald-400 transition-colors">{{team.name}}</h3>

          <div class="flex items-center gap-2">
             <button 
               (click)="openAddAgentModal(team)"
               class="flex-1 px-3 py-2 bg-blue-600/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-600/20"
             >
                Add Agent
             </button>
             <button 
               (click)="deleteTeam(team.id)"
               class="px-3 py-2 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
             >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
             </button>
          </div>
          
          <button (click)="openEditTeamModal(team)" class="absolute top-5 right-5 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>

        <!-- Add Empty State -->
        <div *ngIf="teams.length === 0" class="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-[#334155] rounded-3xl bg-slate-800/20">
            <p class="text-slate-500 mb-4 italic">No teams created yet.</p>
            <button (click)="openAddTeamModal()" class="text-emerald-500 hover:underline font-bold uppercase text-xs">Create your first team</button>
        </div>
      </div>

      <!-- Modals (Simplified Inline for MVP) -->
      <div *ngIf="isTeamModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModals()"></div>
        <div class="relative bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
           <h2 class="text-white font-bold text-lg mb-6">{{ isEditMode ? 'Rename Team' : 'Create New Team' }}</h2>
           <input [(ngModel)]="teamName" placeholder="e.g. Alpha Sales Team" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white mb-6 focus:border-emerald-500 outline-none">
           <div class="flex justify-end gap-3">
             <button (click)="closeModals()" class="text-slate-400 text-xs font-bold uppercase">Cancel</button>
             <button (click)="saveTeam()" class="bg-emerald-600 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-900/40">Save</button>
           </div>
        </div>
      </div>

      <div *ngIf="isAgentModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModals()"></div>
        <div class="relative bg-[#1e293b] border border-[#334155] rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
           <h2 class="text-white font-bold text-xl mb-2">New Agent Interaction</h2>
           <p class="text-slate-400 text-xs mb-8">Assigning to <span class="text-emerald-400 font-bold italic">{{ selectedTeam?.name }}</span></p>
           
           <div class="space-y-4 mb-8">
             <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Agent Name</label>
                <input [(ngModel)]="agentData.name" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none">
             </div>
             <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Email</label>
                <input [(ngModel)]="agentData.email" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none">
             </div>
             <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Credentials (Password)</label>
                <input type="password" [(ngModel)]="agentData.password" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none">
             </div>
           </div>

           <div class="flex justify-end gap-4">
             <button (click)="closeModals()" class="text-slate-400 text-xs font-black uppercase tracking-widest">Cancel</button>
             <button (click)="saveAgent()" class="bg-emerald-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-900/40 hover:bg-emerald-700 transition-all">Add Agent Now</button>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
  `]
})
export class TeamManagementComponent implements OnInit {
  teams: any[] = [];
  isLoading = true;

  // States
  isTeamModalOpen = false;
  isAgentModalOpen = false;
  isEditMode = false;

  // Form Data
  teamName = '';
  selectedTeam: any = null;
  agentData = { name: '', email: '', password: '' };

  constructor(private teamService: TeamService) { }

  ngOnInit() {
    this.loadTeams();
  }

  loadTeams() {
    this.isLoading = true;
    this.teamService.getTeams().subscribe({
      next: (data) => {
        this.teams = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  openAddTeamModal() {
    this.isEditMode = false;
    this.teamName = '';
    this.isTeamModalOpen = true;
  }

  openEditTeamModal(team: any) {
    this.isEditMode = true;
    this.selectedTeam = team;
    this.teamName = team.name;
    this.isTeamModalOpen = true;
  }

  openAddAgentModal(team: any) {
    this.selectedTeam = team;
    this.agentData = { name: '', email: '', password: '' };
    this.isAgentModalOpen = true;
  }

  closeModals() {
    this.isTeamModalOpen = false;
    this.isAgentModalOpen = false;
  }

  saveTeam() {
    if (!this.teamName) return;

    const obs = this.isEditMode
      ? this.teamService.updateTeam(this.selectedTeam.id, this.teamName)
      : this.teamService.createTeam(this.teamName);

    obs.subscribe(() => {
      this.closeModals();
      this.loadTeams();
    });
  }

  saveAgent() {
    if (!this.agentData.email || !this.agentData.password) return;

    this.teamService.createAgent(this.selectedTeam.id, this.agentData).subscribe(() => {
      this.closeModals();
      this.loadTeams();
    });
  }

  deleteTeam(id: number) {
    if (confirm('Are you sure you want to delete this team?')) {
      this.teamService.deleteTeam(id).subscribe(() => this.loadTeams());
    }
  }
}
