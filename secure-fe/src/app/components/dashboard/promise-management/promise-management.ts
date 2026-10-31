import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromiseCategoryDto, PromiseService, PromiseStatus } from '../../../services/promise.service';
import { AuthService } from '../../../services/auth.service';
import { OrganizationService } from '../../../services/organization.service';
import { TeamService } from '../../../services/team.service';

interface PromiseRow {
    id: number;
    title: string;
    description?: string | null;
    status: PromiseStatus;
    dueDate: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: number;
        name?: string | null;
        organizationId?: number | null;
        team?: { id: number; name: string } | null;
    } | null;
    category?: {
        id: number;
        name: string;
    } | null;
    userId?: number;
    categoryId?: number;
}

type PromiseModalMode = 'create' | 'edit';

@Component({
    selector: 'app-promise-management',
    standalone: true,
    imports: [CommonModule, DatePipe, FormsModule],
    template: `
    <div class="p-8 h-full overflow-y-auto">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-white mb-2">Promise Management Dashboard</h1>
          </div>
          
          <!-- Organization Filter (Super Admin Only) -->
          <div class="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div *ngIf="isSuperAdmin && organizations.length > 0" class="flex items-center gap-3">
              <label class="text-sm text-slate-300">Select Organization:</label>
              <select
                [(ngModel)]="selectedOrganizationId"
                (change)="onOrganizationChange()"
                class="bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-w-[200px]">
                <option [ngValue]="null">All Organizations</option>
                <option *ngFor="let org of organizations" [ngValue]="org.id">{{ org.name }}</option>
              </select>
            </div>

            <button
              (click)="openCreateModal()"
              class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium">
              Add Promise
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="mt-5 bg-[#0b1220] border border-[#334155] rounded-xl p-4">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label class="text-xs text-slate-400">Status</label>
              <select [(ngModel)]="filters.status" (change)="loadPromises()"
                class="mt-1 w-full bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm">
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="BROKEN">Broken</option>
              </select>
            </div>

            <div>
              <label class="text-xs text-slate-400">Category</label>
              <select [(ngModel)]="filters.categoryId" (change)="loadPromises()"
                class="mt-1 w-full bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm">
                <option [ngValue]="null">All</option>
                <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div *ngIf="!isAgentUser">
              <label class="text-xs text-slate-400">Assignee</label>
              <select [(ngModel)]="filters.userId" (change)="loadPromises()"
                class="mt-1 w-full bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm">
                <option [ngValue]="null">All</option>
                <option *ngFor="let a of agents" [ngValue]="a.id">{{ a.name || a.email }}</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="text-xs text-slate-400">Search (title)</label>
              <input [(ngModel)]="filters.q" (ngModelChange)="onSearchChanged()"
                placeholder="e.g. Call customer back"
                class="mt-1 w-full bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div *ngIf="errorMessage" class="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Total Promises -->
        <div class="bg-[#1e293b] rounded-lg p-4 border border-[#334155] relative overflow-hidden">
            <div class="flex justify-between items-start mb-2">
                <span class="text-slate-400 text-sm">Total Promises</span>
                <span class="bg-green-500/20 text-green-400 p-1 rounded">
                    <!-- Icon placeholder -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </span>
            </div>
            <div class="text-3xl font-bold text-white mb-1">{{stats?.total || 0}}</div>
            <div class="text-[10px] text-slate-500 bg-[#334155] inline-block px-2 py-0.5 rounded-full">All time</div>
        </div>

        <!-- Fulfillment Rate -->
        <div class="bg-[#1e293b] rounded-lg p-4 border border-[#334155]">
            <div class="flex justify-between items-start mb-2">
                <span class="text-slate-400 text-sm">Fulfillment Rate</span>
                <span class="bg-yellow-500/20 text-yellow-400 p-1 rounded">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </span>
            </div>
            <div class="text-3xl font-bold text-yellow-500 mb-1">{{stats?.fulfillmentRate || 0}}%</div>
             <div class="text-[10px] text-green-400 bg-green-500/10 inline-block px-2 py-0.5 rounded-full">Based on completed</div>
        </div>

        <!-- Pending -->
        <div class="bg-[#1e293b] rounded-lg p-4 border border-[#334155]">
            <div class="flex justify-between items-start mb-2">
                <span class="text-slate-400 text-sm">Pending</span>
                <span class="bg-purple-500/20 text-purple-400 p-1 rounded">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
            </div>
            <div class="text-3xl font-bold text-purple-400 mb-1">{{stats?.pending || 0}}</div>
             <div class="text-[10px] text-slate-500 bg-[#334155] inline-block px-2 py-0.5 rounded-full">Active promises</div>
        </div>

         <!-- Missed Promises -->
        <div class="bg-[#1e293b] rounded-lg p-4 border border-[#334155]">
            <div class="flex justify-between items-start mb-2">
                <span class="text-slate-400 text-sm">Missed Promises</span>
                <span class="bg-red-500/20 text-red-400 p-1 rounded">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </span>
            </div>
            <div class="text-3xl font-bold text-red-500 mb-1">{{stats?.broken || 0}}</div>
             <div class="text-[10px] text-slate-500 bg-[#334155] inline-block px-2 py-0.5 rounded-full">Requires attention</div>
        </div>
      </div>

      <!-- Mid Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Agent Performance -->
        <div class="bg-[#1e293b] rounded-xl border border-[#334155] p-5 col-span-1">
            <h3 class="text-white font-medium mb-4">Agent Performance</h3>
             <div class="space-y-4">
                    <div *ngFor="let agent of stats?.agentPerformance; let i=index" class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-xs font-bold text-white">{{i+1}}</div>
                    <div class="flex-1">
                        <div class="text-white text-sm font-medium">{{agent.name}}</div>
                        <div class="text-slate-500 text-xs">{{agent.team}} • {{agent.stats}}</div>
                    </div>
                    <div class="text-green-400 font-bold text-sm">{{agent.score}}%</div>
                </div>
                <div *ngIf="!stats?.agentPerformance?.length" class="text-slate-500 text-sm text-center py-4">No data available</div>
             </div>
        </div>

        <!-- Promise Status Distribution (Chart Placeholder) -->
        <div class="bg-[#1e293b] rounded-xl border border-[#334155] p-5 col-span-2">
            <h3 class="text-white font-medium mb-4">Promise Status Distribution</h3>
            <!-- Placeholder for chart -->
            <div class="w-full h-48 flex items-end justify-between px-10 relative">
               <!-- Simple CSS Bars as mockup -->
                <div class="w-1/4 bg-emerald-500/20 h-full mx-2 rounded-t flex items-end justify-center group relative cursor-pointer">
                    <div class="w-full bg-emerald-600 h-[70%] rounded-t"></div>
                </div>
                <div class="w-1/4 bg-emerald-500/20 h-full mx-2 rounded-t flex items-end justify-center relative cursor-pointer">
                     <div class="w-full bg-yellow-500 h-[60%] rounded-t"></div>
                </div>
                <div class="w-1/4 bg-emerald-500/20 h-full mx-2 rounded-t flex items-end justify-center relative cursor-pointer">
                     <div class="w-full bg-green-500 h-[40%] rounded-t"></div>
                </div>
                <div class="absolute bottom-[-20px] left-0 w-full flex justify-between px-12 text-xs text-slate-400">
                    <span>Fulfillment Rate</span>
                    <span>Avg Fulfillment Time</span>
                    <span>Missed Promises</span>
                </div>
            </div>
            
        </div>
      </div>

      <!-- Tracker Section -->
      <div class="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
          <div class="p-4 border-b border-[#334155] flex justify-between items-center bg-[#1e293b]">
              <h3 class="text-white font-medium">Promise Tracker</h3>
              <div class="flex gap-2 text-xs">
                <button (click)="loadData()" class="bg-[#334155] text-white px-3 py-1 rounded hover:bg-slate-600">Refresh</button>
              </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead class="bg-[#1e293b] text-slate-400 text-xs uppercase font-semibold">
                    <tr>
                        <th class="p-4">Agent</th>
                        <th class="p-4">Team</th>
                        <th class="p-4">Category</th>
                        <th class="p-4">Title</th>
                        <th class="p-4">Status</th>
                        <th class="p-4">Due Date</th>
                        <th class="p-4">Created On</th>
                        <th class="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[#334155] text-sm md:text-xs lg:text-sm">
                    <tr *ngIf="isLoadingPromises">
                      <td colspan="8" class="p-8 text-center text-slate-500">Loading promises…</td>
                    </tr>
                    <tr *ngFor="let row of promises" class="hover:bg-[#334155]/50 transition-colors">
                        <td class="p-4 text-white font-medium">{{row.user?.name || 'Unknown'}}</td>
                        <td class="p-4 text-slate-300">{{row.user?.team?.name || 'No Team'}}</td>
                        <td class="p-4 text-slate-300">{{row.category?.name || 'General'}}</td>
                        <td class="p-4 text-white">
                          <div class="flex items-center gap-2">
                            <span>{{row.title}}</span>
                            <span *ngIf="isOverdue(row)" class="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/20">Overdue</span>
                          </div>
                        </td>
                        <td class="p-4">
                          <div class="flex items-center gap-2">
                            <span class="px-2 py-1 rounded text-xs font-medium" 
                                  [ngClass]="{
                                    'bg-green-500/20 text-green-400': row.status === 'FULFILLED',
                                    'bg-red-500/20 text-red-400': row.status === 'BROKEN',
                                    'bg-yellow-500/20 text-yellow-400': row.status === 'PENDING'
                                  }">
                                {{row.status}}
                            </span>
                            <select
                              [ngModel]="row.status"
                              (ngModelChange)="onInlineStatusChange(row, $event)"
                              class="bg-[#0b1220] border border-[#334155] text-slate-200 rounded-md px-2 py-1 text-xs">
                              <option value="PENDING">PENDING</option>
                              <option value="FULFILLED">FULFILLED</option>
                              <option value="BROKEN">BROKEN</option>
                            </select>
                          </div>
                        </td>
                        <td class="p-4 text-white">{{row.dueDate | date:'shortDate'}}</td>
                        <td class="p-4 text-slate-500">{{row.createdAt | date:'shortDate'}}</td>
                        <td class="p-4 text-right">
                          <div class="flex justify-end gap-2">
                            <button (click)="openEditModal(row)" class="bg-[#334155] text-white px-3 py-1 rounded hover:bg-slate-600 text-xs">Edit</button>
                            <button (click)="onDelete(row)" class="bg-red-600/30 text-red-200 px-3 py-1 rounded hover:bg-red-600/40 text-xs">Delete</button>
                          </div>
                        </td>
                    </tr>
                    <tr *ngIf="promises.length === 0">
                        <td colspan="8" class="p-8 text-center text-slate-500">No promises found.</td>
                    </tr>
                </tbody>
            </table>
          </div>
      </div>
      
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60" (click)="closeModal()"></div>
      <div class="relative w-full max-w-2xl bg-[#0b1220] border border-[#334155] rounded-2xl overflow-hidden">
        <div class="p-5 border-b border-[#334155] flex items-center justify-between">
          <div class="text-white font-semibold">
            {{ modalMode === 'create' ? 'Create Promise' : 'Edit Promise' }}
          </div>
          <button class="text-slate-300 hover:text-white" (click)="closeModal()">✕</button>
        </div>

        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="text-xs text-slate-400">Title *</label>
            <input [(ngModel)]="form.title"
              class="mt-1 w-full bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm"
              placeholder="e.g. Send disclosure pack" />
          </div>

          <div class="md:col-span-2">
            <label class="text-xs text-slate-400">Description</label>
            <textarea [(ngModel)]="form.description"
              class="mt-1 w-full bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm min-h-[90px]"
              placeholder="Optional details"></textarea>
          </div>

          <div>
            <label class="text-xs text-slate-400">Due Date *</label>
            <input type="date" [(ngModel)]="form.dueDate"
              class="mt-1 w-full bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm" />
          </div>

          <div>
            <label class="text-xs text-slate-400">Status</label>
            <select [(ngModel)]="form.status"
              class="mt-1 w-full bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm">
              <option value="PENDING">PENDING</option>
              <option value="FULFILLED">FULFILLED</option>
              <option value="BROKEN">BROKEN</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-slate-400">Category</label>
            <select [(ngModel)]="form.categoryId"
              class="mt-1 w-full bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm">
              <option [ngValue]="null">General</option>
              <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div *ngIf="!isAgentUser">
            <label class="text-xs text-slate-400">Assignee</label>
            <select [(ngModel)]="form.userId"
              class="mt-1 w-full bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm">
              <option [ngValue]="null">Me</option>
              <option *ngFor="let a of agents" [ngValue]="a.id">{{ a.name || a.email }}</option>
            </select>
          </div>

          <div *ngIf="modalErrorMessage" class="md:col-span-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {{ modalErrorMessage }}
          </div>
        </div>

        <div class="p-5 border-t border-[#334155] flex items-center justify-end gap-2">
          <button (click)="closeModal()" class="bg-[#334155] text-white px-4 py-2 rounded-md text-sm hover:bg-slate-600">Cancel</button>
          <button (click)="saveModal()" [disabled]="isSaving"
            class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium">
            {{ isSaving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class PromiseManagementComponent implements OnInit {
    stats: any = {};
    promises: PromiseRow[] = [];
    categories: PromiseCategoryDto[] = [];
    agents: any[] = [];

    isLoadingPromises = false;
    errorMessage = '';

    filters: {
        status: '' | PromiseStatus;
        categoryId: number | null;
        userId: number | null;
        q: string;
    } = {
            status: '',
            categoryId: null,
            userId: null,
            q: ''
        };
    
    // Organization filtering
    isSuperAdmin = false;
    isAgentUser = false;
    organizations: any[] = [];
    selectedOrganizationId: number | null = null;
    userOrganizationId: number | null = null;

    // Modal
    isModalOpen = false;
    modalMode: PromiseModalMode = 'create';
    isSaving = false;
    modalErrorMessage = '';
    form: {
        id: number | null;
        title: string;
        description: string;
        dueDate: string;
        status: PromiseStatus;
        categoryId: number | null;
        userId: number | null;
    } = {
            id: null,
            title: '',
            description: '',
            dueDate: '',
            status: 'PENDING',
            categoryId: null,
            userId: null
        };

    private searchDebounce: any;

    constructor(
        private readonly promiseService: PromiseService,
        private readonly authService: AuthService,
        private readonly organizationService: OrganizationService,
        private readonly teamService: TeamService
    ) { }

    ngOnInit() {
        const user: any = this.authService.getUser();
        if (user) {
            this.isSuperAdmin = !user.organizationId;
            this.userOrganizationId = user.organizationId || null;
            this.isAgentUser = user.role === 'Agent' || user?.role?.name === 'Agent';
            
            // For regular admins, use their organizationId automatically
            if (!this.isSuperAdmin && this.userOrganizationId) {
                this.selectedOrganizationId = this.userOrganizationId;
            }
            
            // Load organizations for super_admin
            if (this.isSuperAdmin) {
                this.loadOrganizations();
            }
        }
        
        this.loadLookups();
        this.loadData();
    }

    loadOrganizations() {
        this.organizationService.getAllOrganizations().subscribe({
            next: (orgs) => {
                this.organizations = orgs;
            },
            error: (err) => {
                console.error('Failed to load organizations', err);
            }
        });
    }

    loadLookups() {
        this.promiseService.getCategories().subscribe({
            next: (cats) => (this.categories = cats || []),
            error: () => {
                // Non-blocking
                this.categories = [];
            }
        });

        if (!this.isAgentUser) {
            this.teamService.getAgents().subscribe({
                next: (agents) => (this.agents = agents || []),
                error: () => (this.agents = [])
            });
        }
    }

    onOrganizationChange() {
        this.loadData();
    }

    loadData() {
        this.loadStats();
        this.loadPromises();
    }

    loadStats() {
        const orgId = this.isSuperAdmin ? this.selectedOrganizationId : this.userOrganizationId;
        this.promiseService.getStats(orgId).subscribe({
            next: (data) => (this.stats = data),
            error: (err) => console.error('Error loading stats', err)
        });
    }

    loadPromises() {
        this.errorMessage = '';
        this.isLoadingPromises = true;

        const orgId = this.isSuperAdmin ? this.selectedOrganizationId : this.userOrganizationId;

        const filters: Record<string, any> = {
            ...(orgId ? { organizationId: orgId } : {}),
            ...(this.filters.status ? { status: this.filters.status } : {}),
            ...(this.filters.categoryId ? { categoryId: this.filters.categoryId } : {}),
            ...(this.filters.userId ? { userId: this.filters.userId } : {})
        };

        this.promiseService.getAllPromises(filters).subscribe({
            next: (data: any[]) => {
                const rows = (data || []) as PromiseRow[];
                this.promises = this.filters.q
                    ? rows.filter(r => (r.title || '').toLowerCase().includes(this.filters.q.toLowerCase()))
                    : rows;
                this.isLoadingPromises = false;
            },
            error: (err) => {
                console.error('Error loading promises', err);
                this.errorMessage = 'Failed to load promises. Please try again.';
                this.promises = [];
                this.isLoadingPromises = false;
            }
        });
    }

    onSearchChanged() {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => this.loadPromises(), 250);
    }

    isOverdue(row: PromiseRow) {
        if (row?.status !== 'PENDING' || !row?.dueDate) return false;
        const due = new Date(row.dueDate).getTime();
        if (Number.isNaN(due)) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return due < now.getTime();
    }

    onInlineStatusChange(row: PromiseRow, newStatus: PromiseStatus) {
        if (!row || row.status === newStatus) return;
        const prev = row.status;
        row.status = newStatus;
        this.promiseService.updateStatus(row.id, newStatus).subscribe({
            next: () => this.loadData(),
            error: (err) => {
                console.error('Failed to update status', err);
                row.status = prev;
                this.errorMessage = 'Failed to update status.';
            }
        });
    }

    openCreateModal() {
        this.modalMode = 'create';
        this.modalErrorMessage = '';
        this.form = {
            id: null,
            title: '',
            description: '',
            dueDate: this.toDateInputValue(new Date()),
            status: 'PENDING',
            categoryId: null,
            userId: null
        };
        this.isModalOpen = true;
    }

    openEditModal(row: PromiseRow) {
        this.modalMode = 'edit';
        this.modalErrorMessage = '';
        this.form = {
            id: row.id,
            title: row.title || '',
            description: row.description || '',
            dueDate: this.toDateInputValue(new Date(row.dueDate)),
            status: row.status,
            categoryId: row.category?.id ?? row.categoryId ?? null,
            userId: row.user?.id ?? row.userId ?? null
        };
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.isSaving = false;
        this.modalErrorMessage = '';
    }

    saveModal() {
        this.modalErrorMessage = '';
        const title = (this.form.title || '').trim();
        if (!title) {
            this.modalErrorMessage = 'Title is required.';
            return;
        }
        if (!this.form.dueDate) {
            this.modalErrorMessage = 'Due date is required.';
            return;
        }

        const payload: any = {
            title,
            description: (this.form.description || '').trim() || null,
            dueDate: this.form.dueDate,
            status: this.form.status,
            categoryId: this.form.categoryId
        };
        if (!this.isAgentUser && this.form.userId) {
            payload.userId = this.form.userId;
        }

        this.isSaving = true;

        const request$ = this.modalMode === 'create'
            ? this.promiseService.createPromise(payload)
            : this.promiseService.updatePromise(this.form.id as number, payload);

        request$.subscribe({
            next: () => {
                this.isSaving = false;
                this.closeModal();
                this.loadData();
            },
            error: (err) => {
                console.error('Failed to save promise', err);
                this.isSaving = false;
                this.modalErrorMessage = 'Failed to save promise. Please try again.';
            }
        });
    }

    onDelete(row: PromiseRow) {
        if (!row) return;
        const ok = globalThis.confirm(`Delete promise "${row.title}"?`);
        if (!ok) return;

        this.promiseService.deletePromise(row.id).subscribe({
            next: () => this.loadData(),
            error: (err) => {
                console.error('Failed to delete promise', err);
                this.errorMessage = 'Failed to delete promise.';
            }
        });
    }

    private toDateInputValue(date: Date) {
        if (!date || Number.isNaN(date.getTime())) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}
