import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesQuery, SalesService } from '../../../services/sales.service';
import { AuthService } from '../../../services/auth.service';
import { OrganizationService } from '../../../services/organization.service';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

type SalesTab = 'overview' | 'team' | 'distribution';
type DatePreset = 'all' | '7d' | '30d' | 'mtd' | 'custom';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="p-8 h-full overflow-y-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-3xl font-semibold text-white mb-1">{{ 'dashboard.sales' | translate }}</h1>
            <p class="text-slate-400 text-sm">{{ 'sales.overview' | translate }}</p>
            <!-- Business Information (Regular Admins) -->
            <div *ngIf="!isSuperAdmin && organizationInfo" class="mt-3 text-xs text-slate-500">
              <span *ngIf="organizationInfo.name">{{ 'organization.name' | translate }}: {{ organizationInfo.name }}</span>
              <span *ngIf="organizationInfo.industry" class="ml-3">{{ 'organization.industry' | translate }}: {{ organizationInfo.industry }}</span>
              <span *ngIf="organizationInfo.city" class="ml-3">{{ 'organization.city' | translate }}: {{ organizationInfo.city }}</span>
            </div>
          </div>

          <!-- Organization Filter (Super Admin Only) -->
          <div *ngIf="isSuperAdmin && organizations.length > 0" class="flex items-center gap-3">
            <label class="text-sm text-slate-300">{{ 'sales.selectOrganization' | translate }}:</label>
            <select
              [(ngModel)]="selectedOrganizationId"
              (change)="onOrganizationChange()"
              class="bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-w-[200px]">
              <option [ngValue]="null">{{ 'sales.allOrganizations' | translate }}</option>
              <option *ngFor="let org of organizations" [ngValue]="org.id">{{ org.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Business Information Card (Regular Admins) -->
      <div *ngIf="!isSuperAdmin && organizationInfo" class="bg-[#1e293b] rounded-xl p-6 mb-6 border border-[#334155]">
        <h3 class="text-white font-semibold mb-4">{{ 'organization.businessInfo' | translate }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div *ngIf="organizationInfo.name">
            <span class="text-slate-400">{{ 'organization.name' | translate }}:</span>
            <span class="text-white ml-2">{{ organizationInfo.name }}</span>
          </div>
          <div *ngIf="organizationInfo.industry">
            <span class="text-slate-400">{{ 'organization.industry' | translate }}:</span>
            <span class="text-white ml-2">{{ organizationInfo.industry }}</span>
          </div>
          <div *ngIf="organizationInfo.size">
            <span class="text-slate-400">{{ 'organization.size' | translate }}:</span>
            <span class="text-white ml-2">{{ organizationInfo.size }}</span>
          </div>
          <div *ngIf="organizationInfo.email">
            <span class="text-slate-400">{{ 'organization.email' | translate }}:</span>
            <span class="text-white ml-2">{{ organizationInfo.email }}</span>
          </div>
          <div *ngIf="organizationInfo.phone">
            <span class="text-slate-400">{{ 'organization.phone' | translate }}:</span>
            <span class="text-white ml-2">{{ organizationInfo.phone }}</span>
          </div>
          <div *ngIf="organizationInfo.website">
            <span class="text-slate-400">{{ 'organization.website' | translate }}:</span>
            <span class="text-white ml-2">{{ organizationInfo.website }}</span>
          </div>
          <div *ngIf="organizationInfo.address">
            <span class="text-slate-400">{{ 'organization.address' | translate }}:</span>
            <span class="text-white ml-2">{{ organizationInfo.address }}</span>
          </div>
          <div *ngIf="organizationInfo.city">
            <span class="text-slate-400">{{ 'organization.city' | translate }}:</span>
            <span class="text-white ml-2">{{ organizationInfo.city }}</span>
          </div>
          <div *ngIf="organizationInfo.country">
            <span class="text-slate-400">{{ 'organization.country' | translate }}:</span>
            <span class="text-white ml-2">{{ organizationInfo.country }}</span>
          </div>
        </div>
      </div>

      <!-- Top Tabs -->
      <div class="flex gap-4 mb-8 overflow-x-auto pb-2" [class.flex-row-reverse]="translationService.isRTL()">
        <button (click)="activeTab='overview'"
          class="px-6 py-2 rounded-md text-sm font-medium transition-colors"
          [ngClass]="activeTab==='overview' ? 'bg-emerald-600 text-white' : 'bg-[#334155] text-slate-300 hover:text-white'">
          {{ 'sales.tabs.overview' | translate }}
        </button>
        <button (click)="activeTab='team'"
          class="px-6 py-2 rounded-md text-sm font-medium transition-colors"
          [ngClass]="activeTab==='team' ? 'bg-emerald-600 text-white' : 'bg-[#334155] text-slate-300 hover:text-white'">
          {{ 'sales.tabs.team' | translate }}
        </button>
        <button (click)="activeTab='distribution'"
          class="px-6 py-2 rounded-md text-sm font-medium transition-colors"
          [ngClass]="activeTab==='distribution' ? 'bg-emerald-600 text-white' : 'bg-[#334155] text-slate-300 hover:text-white'">
          {{ 'sales.tabs.distribution' | translate }}
        </button>
      </div>

      <!-- Controls -->
      <div class="bg-[#0b1220] border border-[#334155] rounded-xl p-4 mb-6" [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4" [class.flex-row-reverse]="translationService.isRTL()">
          <div class="flex flex-col md:flex-row md:items-center gap-3" [class.flex-row-reverse]="translationService.isRTL()">
            <div [class.text-right]="translationService.isRTL()">
              <div class="text-xs text-slate-400 mb-1">{{ 'sales.controls.dateRange' | translate }}</div>
              <select [(ngModel)]="datePreset" (change)="onPresetChanged()"
                class="bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-4 py-2 text-sm min-w-[200px]">
                <option value="all">{{ 'sales.datePresets.all' | translate }}</option>
                <option value="7d">{{ 'sales.datePresets.last7Days' | translate }}</option>
                <option value="30d">{{ 'sales.datePresets.last30Days' | translate }}</option>
                <option value="mtd">{{ 'sales.datePresets.monthToDate' | translate }}</option>
                <option value="custom">{{ 'sales.datePresets.custom' | translate }}</option>
              </select>
            </div>

            <div *ngIf="datePreset==='custom'" class="flex items-end gap-2" [class.flex-row-reverse]="translationService.isRTL()">
              <div [class.text-right]="translationService.isRTL()">
                <div class="text-xs text-slate-400 mb-1">{{ 'sales.controls.start' | translate }}</div>
                <input type="date" [(ngModel)]="customStart"
                  class="bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <div [class.text-right]="translationService.isRTL()">
                <div class="text-xs text-slate-400 mb-1">{{ 'sales.controls.end' | translate }}</div>
                <input type="date" [(ngModel)]="customEnd"
                  class="bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <button (click)="applyCustomRange()"
                class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium">
                {{ 'sales.controls.apply' | translate }}
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button (click)="loadData()"
              class="bg-[#334155] text-white px-4 py-2 rounded-md text-sm hover:bg-slate-600">
              {{ 'sales.controls.refresh' | translate }}
            </button>
          </div>
        </div>

        <div *ngIf="errorMessage" class="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {{ errorMessage }}
        </div>
      </div>

      <!-- Revenue Main Section -->
      <div class="bg-[#1e293b] rounded-xl p-6 mb-6 border border-[#334155]">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 class="text-slate-300 font-medium mb-1">{{ 'sales.totalRevenue' | translate }}</h3>
            <div class="flex items-center gap-3">
              <span class="text-3xl font-bold text-white">₹ {{ stats.totalRevenue | number:'1.0-0' }}</span>
              <span class="text-xs px-2 py-1 rounded font-medium flex items-center gap-1"
                [ngClass]="stats.growthPercentage >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-300'">
                {{ stats.growthPercentage >= 0 ? '↑' : '↓' }} {{ abs(stats.growthPercentage) }}%
              </span>
            </div>
            <!-- Rupee Icon Decoration -->
            <div class="absolute top-6 left-[-10px] w-1 h-8 bg-emerald-500 rounded-r"></div>
            <p class="text-xs text-slate-400 mt-1">{{ stats.dealsClosed }} {{ 'sales.dealsClosed' | translate }}</p>
            <p class="text-xs text-slate-500 mt-1" *ngIf="rangeLabel">{{ rangeLabel }}</p>
          </div>
        </div>
      </div>

      <!-- Detail Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6" *ngIf="activeTab==='overview' || activeTab==='distribution' || activeTab==='team'">

        <!-- Revenue Distribution (Donut) -->
         <div *ngIf="activeTab!=='team'" class="bg-[#1e293b] rounded-xl p-5 border border-[#334155] col-span-1 md:col-span-1">
            <h3 class="text-slate-300 text-xs font-medium mb-4">{{ 'sales.revenueDistribution' | translate }}</h3>
            <div class="flex items-center gap-4">
                <!-- CSS Donut Chart Mockup -->
                <div class="relative w-24 h-24 rounded-full"
                     [style.background]="donutBackground">
                     <div class="absolute inset-2 bg-[#1e293b] rounded-full"></div>
                </div>

                <!-- Legend -->
                <div class="flex flex-col gap-1 w-full">
                    <div *ngFor="let item of revenueDistribution" class="flex items-center justify-between text-[10px] text-slate-300">
                        <div class="flex items-center gap-2">
                             <span class="w-2 h-2 rounded-full" [style.backgroundColor]="getSourceColor(item.source)"></span>
                             {{ item.source }}
                        </div>
                        <span>{{ item.percentage }}%</span>
                    </div>
                    <div *ngIf="revenueDistribution.length === 0" class="text-[10px] text-slate-500">No closed-deal revenue in this range.</div>
                </div>
            </div>
         </div>

         <!-- Dynamic Team Cards -->
         <div *ngIf="activeTab!=='distribution'" class="contents">
           <div *ngFor="let team of teamPerformance"
              class="bg-[#1e293b] rounded-xl p-5 border border-[#334155] relative overflow-hidden group hover:border-emerald-500/50 transition-colors">

            <h3 class="text-slate-400 text-xs font-medium mb-1">{{ team.teamName }}</h3>
            <div class="text-2xl font-bold text-white mb-1">₹ {{ team.revenue | number:'1.0-0' }}</div>
            <p class="text-[10px] text-slate-500">{{ team.dealsClosed }} Deals • {{ team.agentCount }} Agents</p>

            <div *ngIf="team.revenue > 100000" class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-3xl"></div>
           </div>

         <!-- Empty State if no teams -->
         <div *ngIf="teamPerformance.length === 0" class="bg-[#1e293b] rounded-xl p-5 border border-[#334155] flex items-center justify-center">
             <span class="text-slate-500 text-xs">{{ 'sales.noTeamData' | translate }}</span>
         </div>
         </div>
      </div>

    </div>
  `,
  styles: []
})
export class SalesDashboardComponent implements OnInit {
  stats: any = { totalRevenue: 0, dealsClosed: 0, growthPercentage: 0 };
  teamPerformance: any[] = [];
  revenueDistribution: any[] = [];

  activeTab: SalesTab = 'overview';
  datePreset: DatePreset = '30d';
  customStart = '';
  customEnd = '';
  rangeLabel = '';
  donutBackground = 'conic-gradient(#334155 0% 100%)';

  isLoading = false;
  errorMessage = '';

  // Organization filtering
  isSuperAdmin = false;
  organizations: any[] = [];
  selectedOrganizationId: number | null = null;
  userOrganizationId: number | null = null;
  organizationInfo: any = null;

  constructor(
    private readonly salesService: SalesService,
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
    public readonly translationService: TranslationService
  ) { }

  ngOnInit() {
    const user: any = this.authService.getUser();
    if (user) {
      // Handle both cases: role as string or role as object with name property
      let userRole = '';
      if (user.role && typeof user.role === 'object' && user.role.name) {
        userRole = user.role.name;
      } else if (typeof user.role === 'string') {
        userRole = user.role;
      }
      this.isSuperAdmin = userRole === 'super_admin' || userRole === 'Super Admin';
      this.userOrganizationId = user.organizationId || null;

      // For regular admins, use their organizationId
      if (!this.isSuperAdmin && this.userOrganizationId) {
        this.selectedOrganizationId = this.userOrganizationId;
        this.loadOrganizationInfo();
      }

      // Load organizations for super_admin
      if (this.isSuperAdmin) {
        this.loadOrganizations();
      }
    }

    this.loadData();
  }

  loadOrganizationInfo() {
    if (this.userOrganizationId) {
      this.organizationService.getOrganizationById(this.userOrganizationId).subscribe({
        next: (org) => {
          this.organizationInfo = org;
        },
        error: (err) => {
          console.error('Failed to load organization info', err);
        }
      });
    }
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

  onOrganizationChange() {
    this.loadData();
  }

  loadData() {
    this.errorMessage = '';
    this.isLoading = true;

    // For super_admin: use selectedOrganizationId (null = all organizations)
    // For regular admins: use their organizationId automatically
    const orgId = this.isSuperAdmin
      ? this.selectedOrganizationId
      : this.userOrganizationId;

    const range = this.getRange();
    const query: SalesQuery = {
      organizationId: orgId,
      ...(range?.startDate ? { startDate: range.startDate.toISOString() } : {}),
      ...(range?.endDate ? { endDate: range.endDate.toISOString() } : {})
    };

    this.rangeLabel = range?.label || '';

    this.salesService.getStats(query).subscribe({
      next: (data) => (this.stats = data || this.stats),
      error: () => (this.errorMessage = 'Failed to load stats.')
    });

    this.salesService.getTeamPerformance(query).subscribe({
      next: (data) => (this.teamPerformance = data || []),
      error: () => (this.errorMessage = this.errorMessage || 'Failed to load team performance.')
    });

    this.salesService.getRevenueDistribution(query).subscribe({
      next: (data) => {
        this.revenueDistribution = data || [];
        this.donutBackground = this.buildDonutBackground(this.revenueDistribution);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.errorMessage || 'Failed to load revenue distribution.';
        this.revenueDistribution = [];
        this.donutBackground = this.buildDonutBackground([]);
        this.isLoading = false;
      }
    });
  }

  onPresetChanged() {
    if (this.datePreset !== 'custom') {
      const range = this.getRange();
      this.customStart = range?.startDate ? this.toDateInput(range.startDate) : '';
      this.customEnd = range?.endDate ? this.toDateInput(range.endDate) : '';
      this.loadData();
    }
  }

  applyCustomRange() {
    this.loadData();
  }

  abs(value: number) {
    return Math.abs(Number(value) || 0);
  }

  getSourceColor(source: string) {
    const key = (source || 'Other').toLowerCase();
    if (key.includes('closing')) return '#10b981';
    if (key.includes('pitch')) return '#3b82f6';
    if (key.includes('follow')) return '#f59e0b';
    if (key.includes('discovery')) return '#a855f7';
    return '#64748b';
  }

  private getRange(): { startDate?: Date; endDate?: Date; label: string } | null {
    switch (this.datePreset) {
      case 'all':
        return this.getAllTimeRange();
      case '7d':
        return this.getLastDaysRange(7);
      case '30d':
        return this.getLastDaysRange(30);
      case 'mtd':
        return this.getMonthToDateRange();
      case 'custom':
        return this.getCustomRange();
      default:
        return null;
    }
  }

  private getAllTimeRange() {
    return { label: this.translationService.t('sales.datePresets.all') };
  }

  private getLastDaysRange(days: number) {
    const now = new Date();
    const end = this.endOfDay(now);
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    const labelKey = days === 7 ? 'sales.datePresets.last7Days' : 'sales.datePresets.last30Days';
    return { startDate: start, endDate: end, label: this.translationService.t(labelKey) };
  }

  private getMonthToDateRange() {
    const now = new Date();
    const end = this.endOfDay(now);
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end, label: this.translationService.t('sales.datePresets.monthToDate') };
  }

  private getCustomRange() {
    const start = this.customStart ? new Date(`${this.customStart}T00:00:00.000`) : undefined;
    const endCustom = this.customEnd ? new Date(`${this.customEnd}T23:59:59.999`) : undefined;
    const startDate = start && !Number.isNaN(start.getTime()) ? start : undefined;
    const endDate = endCustom && !Number.isNaN(endCustom.getTime()) ? endCustom : undefined;
    const label = startDate && endDate ? `${this.customStart} → ${this.customEnd}` : this.translationService.t('sales.datePresets.custom');
    return { startDate, endDate, label };
  }

  private endOfDay(date: Date) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private buildDonutBackground(items: any[]) {
    if (!items || items.length === 0) {
      return 'conic-gradient(#334155 0% 100%)';
    }

    const total = items.reduce((sum: number, i: any) => sum + (Number(i.revenue) || 0), 0);
    if (total <= 0) return 'conic-gradient(#334155 0% 100%)';

    let current = 0;
    const parts: string[] = [];
    items.forEach((item: any, idx: number) => {
      const rev = Number(item.revenue) || 0;
      const pct = idx === items.length - 1 ? (100 - current) : Math.round((rev / total) * 1000) / 10;
      const start = current;
      const end = Math.min(100, current + pct);
      const color = this.getSourceColor(item.source);
      parts.push(`${color} ${start}% ${end}%`);
      current = end;
    });

    if (current < 100) {
      parts.push(`#334155 ${current}% 100%`);
    }

    return `conic-gradient(${parts.join(', ')})`;
  }

  private toDateInput(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
