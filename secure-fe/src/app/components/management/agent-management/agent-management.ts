import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../../services/team.service';
import { RoleService, Role } from '../../../services/role.service';
import { CallAnalysisService } from '../../../services/call-analysis.service';

@Component({
  selector: 'app-agent-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 h-full overflow-y-auto custom-scrollbar">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1">User Management</h1>
          <p class="text-slate-400 text-sm italic">Monitor and manage your high-performing team members and agents.</p>
        </div>
        <button 
          (click)="openAddAgentModal()"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-lg shadow-emerald-900/40 active:scale-95"
        >
          Add User +
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        <div *ngFor="let i of [1,2,3,4]" class="bg-[#1e293b]/50 h-32 rounded-xl border border-[#334155]"></div>
      </div>

      <!-- Grid -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div *ngFor="let agent of agents" class="bg-[#1e293b] rounded-xl p-5 border border-[#334155] relative group hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-500/5">
          <div class="flex justify-between items-start mb-4">
            <div class="flex flex-col gap-1">
              <span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold tracking-tighter w-fit">{{ agent.role?.name || 'User' }}</span>
            </div>
            <span class="text-[10px] text-slate-400 font-black uppercase">{{ agent.team?.name || 'No Team' }}</span>
          </div>
          
          <h3 class="text-white font-bold text-lg mb-1 group-hover:text-emerald-400 transition-colors">{{agent.name}}</h3>
          <p class="text-slate-500 text-xs mb-6 truncate">{{agent.email}}</p>

          <div class="flex items-center gap-2">
             <button 
               (click)="viewPerformance(agent)"
               class="flex-1 px-3 py-2 bg-slate-700/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-700 hover:text-white transition-all border border-slate-600/20"
             >
                View Performance
             </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="agents.length === 0" class="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-[#334155] rounded-3xl bg-slate-800/20">
            <p class="text-slate-500 mb-4 italic">No agents created yet.</p>
            <button (click)="openAddAgentModal()" class="text-emerald-500 hover:underline font-bold uppercase text-xs">Add your first agent</button>
        </div>
      </div>

      <!-- Create Agent Modal -->
      <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="relative bg-[#1e293b] border border-[#334155] rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
           <h2 class="text-white font-bold text-xl mb-2">Create New User</h2>
           <p class="text-slate-400 text-xs mb-8">Set up account access for your new team member.</p>
           
           <div class="space-y-4 mb-8">
             <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Team Assignment</label>
                <select [(ngModel)]="selectedTeamId" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none">
                    <option [value]="null" disabled selected>Select a Team</option>
                    <option *ngFor="let team of teams" [value]="team.id">{{team.name}}</option>
                </select>
             </div>
             <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Role</label>
                <select [(ngModel)]="agentData.roleId" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none">
                    <option [value]="null" disabled selected>Select a Role</option>
                    <option *ngFor="let role of roles" [value]="role.id">{{role.name}}</option>
                </select>
             </div>
             <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                <input [(ngModel)]="agentData.name" placeholder="John Doe" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none">
             </div>
             <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Email Address</label>
                <input [(ngModel)]="agentData.email" placeholder="john@example.com" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none">
             </div>
             <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Password</label>
                <input type="password" [(ngModel)]="agentData.password" placeholder="••••••••" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none">
             </div>
           </div>

           <div class="flex justify-end gap-4">
             <button (click)="closeModal()" class="text-slate-400 text-xs font-black uppercase tracking-widest">Cancel</button>
             <button (click)="saveAgent()" [disabled]="!isFormValid()" [class.opacity-50]="!isFormValid()" class="bg-emerald-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-900/40 hover:bg-emerald-700 transition-all">Create Agent</button>
           </div>
        </div>
      </div>

      <!-- Performance Modal -->
      <div *ngIf="isPerformanceModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closePerformanceModal()"></div>
        <div class="relative bg-[#1e293b] border border-[#334155] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-white font-bold text-xl mb-1">{{ selectedAgent?.name || 'Agent' }} Performance</h2>
              <p class="text-slate-400 text-xs">{{ selectedAgent?.email }}</p>
            </div>
            <button (click)="closePerformanceModal()" class="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoadingPerformance" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>

          <!-- Performance Data -->
          <div *ngIf="!isLoadingPerformance && agentPerformance" class="space-y-6">
            <!-- Key Metrics -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Total Calls</p>
                <p class="text-2xl font-black text-white">{{ agentPerformance.totalCalls || 0 }}</p>
              </div>
              <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Avg Score</p>
                <p class="text-2xl font-black text-emerald-400">{{ agentPerformance.avgScore || 0 }}%</p>
              </div>
              <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Deals Closed</p>
                <p class="text-2xl font-black text-green-400">{{ agentPerformance.dealsClosed || 0 }}</p>
              </div>
              <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Closing Rate</p>
                <p class="text-2xl font-black text-blue-400">{{ agentPerformance.closingRate || 0 }}%</p>
              </div>
            </div>

            <!-- Sentiment Breakdown -->
            <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 class="text-white font-bold text-sm mb-4 uppercase tracking-widest">Sentiment Analysis</h3>
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-slate-300 font-medium">Positive</span>
                    <span class="text-xs text-green-400 font-bold">{{ agentPerformance.sentimentBreakdown?.POSITIVE || 0 }} ({{ getSentimentPercentage('POSITIVE') }}%)</span>
                  </div>
                  <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div [style.width.%]="getSentimentPercentage('POSITIVE')" class="h-full bg-green-500 transition-all"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-slate-300 font-medium">Neutral</span>
                    <span class="text-xs text-yellow-400 font-bold">{{ agentPerformance.sentimentBreakdown?.NEUTRAL || 0 }} ({{ getSentimentPercentage('NEUTRAL') }}%)</span>
                  </div>
                  <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div [style.width.%]="getSentimentPercentage('NEUTRAL')" class="h-full bg-yellow-500 transition-all"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-slate-300 font-medium">Negative</span>
                    <span class="text-xs text-red-400 font-bold">{{ agentPerformance.sentimentBreakdown?.NEGATIVE || 0 }} ({{ getSentimentPercentage('NEGATIVE') }}%)</span>
                  </div>
                  <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div [style.width.%]="getSentimentPercentage('NEGATIVE')" class="h-full bg-red-500 transition-all"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Performance Summary -->
            <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 class="text-white font-bold text-sm mb-4 uppercase tracking-widest">Performance Summary</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between items-center py-2 border-b border-slate-700">
                  <span class="text-slate-400">Total Interactions</span>
                  <span class="text-white font-bold">{{ agentPerformance.totalCalls || 0 }} calls</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-slate-700">
                  <span class="text-slate-400">Average Quality Score</span>
                  <span class="text-emerald-400 font-bold">{{ agentPerformance.avgScore || 0 }}%</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-slate-700">
                  <span class="text-slate-400">Successful Closures</span>
                  <span class="text-green-400 font-bold">{{ agentPerformance.dealsClosed || 0 }} deals</span>
                </div>
                <div class="flex justify-between items-center py-2">
                  <span class="text-slate-400">Conversion Rate</span>
                  <span class="text-blue-400 font-bold">{{ agentPerformance.closingRate || 0 }}%</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="agentPerformance.totalCalls === 0" class="text-center py-8 border-2 border-dashed border-slate-700 rounded-xl">
              <p class="text-slate-400 text-sm">No performance data available yet.</p>
              <p class="text-slate-500 text-xs mt-1">This agent hasn't made any calls yet.</p>
            </div>
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
export class AgentManagementComponent implements OnInit {
  agents: any[] = [];
  teams: any[] = [];
  roles: Role[] = [];
  isLoading = true;
  isModalOpen = false;
  isPerformanceModalOpen = false;
  isLoadingPerformance = false;
  selectedAgent: any = null;
  agentPerformance: any = null;

  // Form Data
  selectedTeamId: number | null = null;
  agentData = { name: '', email: '', password: '123456', roleId: null as number | null };

  constructor(
    private readonly teamService: TeamService,
    private readonly roleService: RoleService,
    private readonly callAnalysisService: CallAnalysisService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.teamService.getAgents().subscribe({
      next: (agents) => {
        this.agents = agents;
        this.teamService.getTeams().subscribe({
          next: (teams) => {
            this.teams = teams;
            this.roleService.getAllRoles().subscribe({
              next: (roles) => {
                this.roles = roles;
                this.isLoading = false;
              },
              error: () => this.isLoading = false
            });
          },
          error: () => this.isLoading = false
        });
      },
      error: () => this.isLoading = false
    });
  }

  openAddAgentModal() {
    this.agentData = { name: '', email: '', password: '123456', roleId: null };

    // Default role to Agent
    const agentRole = this.roles.find(r => r.name === 'Agent');
    if (agentRole) {
      this.agentData.roleId = agentRole.id;
    }

    this.selectedTeamId = null;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  isFormValid() {
    return this.agentData.name && this.agentData.email && this.agentData.password && this.selectedTeamId && this.agentData.roleId;
  }

  saveAgent() {
    if (!this.isFormValid()) return;

    this.teamService.createAgent(this.selectedTeamId!, this.agentData).subscribe({
      next: () => {
        this.closeModal();
        this.loadData();
      },
      error: (err) => {
        console.error('Error creating agent:', err);
        alert('Failed to create agent. Maybe email already exists?');
      }
    });
  }

  viewPerformance(agent: any) {
    this.selectedAgent = agent;
    this.isPerformanceModalOpen = true;
    this.isLoadingPerformance = true;
    this.agentPerformance = null;

    // Fetch all agent performance data
    this.callAnalysisService.getAgentPerformance().subscribe({
      next: (allPerformance) => {
        // Find performance for this specific agent by matching name or email
        const agentName = agent.name || agent.email;
        const performance = allPerformance.find((p: any) => 
          p.name === agentName || 
          p.name === agent.email ||
          p.name?.toLowerCase() === agentName?.toLowerCase()
        );

        if (performance) {
          this.agentPerformance = performance;
        } else {
          // No performance data found - create empty stats
          this.agentPerformance = {
            name: agentName,
            totalCalls: 0,
            avgScore: 0,
            dealsClosed: 0,
            closingRate: 0,
            sentimentBreakdown: { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 }
          };
        }
        this.isLoadingPerformance = false;
      },
      error: (err) => {
        console.error('Error loading performance:', err);
        this.agentPerformance = {
          name: agent.name || agent.email,
          totalCalls: 0,
          avgScore: 0,
          dealsClosed: 0,
          closingRate: 0,
          sentimentBreakdown: { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 }
        };
        this.isLoadingPerformance = false;
      }
    });
  }

  closePerformanceModal() {
    this.isPerformanceModalOpen = false;
    this.selectedAgent = null;
    this.agentPerformance = null;
  }

  getSentimentPercentage(sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'): number {
    if (!this.agentPerformance?.sentimentBreakdown || this.agentPerformance?.totalCalls === 0) {
      return 0;
    }
    const count = this.agentPerformance.sentimentBreakdown[sentiment] || 0;
    return Math.round((count / this.agentPerformance.totalCalls) * 100);
  }
}
