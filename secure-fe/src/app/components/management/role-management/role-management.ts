import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService, Role, Permission } from '../../../services/role.service';
import { OrganizationService } from '../../../services/organization.service';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
    selector: 'app-role-management',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    template: `
    <div class="p-8 h-full overflow-y-auto custom-scrollbar">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1">{{ 'role.title' | translate }}</h1>
          <p class="text-slate-400 text-sm italic">{{ 'role.subtitle' | translate }}</p>
        </div>
        <button 
          (click)="openAddRoleModal()"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-lg shadow-emerald-900/40 active:scale-95"
        >
          {{ 'role.addRole' | translate }} +
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        <div *ngFor="let i of [1,2,3]" class="bg-[#1e293b]/50 h-64 rounded-xl border border-[#334155]"></div>
      </div>

      <!-- Roles Grid -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let role of roles" class="bg-[#1e293b] rounded-xl p-6 border border-[#334155] relative group hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-500/5 flex flex-col">
          <div class="flex justify-between items-start mb-4 gap-2">
            <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 uppercase font-bold tracking-tighter w-fit">{{ 'role.roleId' | translate }}: {{role.id}}</span>
                <div class="flex flex-wrap gap-1.5">
                  <span *ngIf="role.isSystem" class="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 uppercase font-bold tracking-tighter w-fit">{{ 'role.systemRole' | translate }}</span>
                  <span *ngIf="role.organization" class="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase font-bold tracking-tighter w-fit truncate max-w-[120px]">{{role.organization.name}}</span>
                </div>
            </div>
            <span class="text-[10px] text-emerald-400 font-black uppercase whitespace-nowrap flex-shrink-0">{{role._count?.users || 0}} {{ (role._count?.users || 0) === 1 ? ('role.user' | translate) : ('role.users' | translate) }}</span>
          </div>
          
          <h3 class="text-white font-bold text-xl mb-2 group-hover:text-emerald-400 transition-colors">{{role.name}}</h3>
          <p class="text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">{{role.description || ('role.noDescription' | translate)}}</p>

          <div class="mb-6 flex-grow">
            <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{{ 'role.permissions' | translate }} ({{role.permissions.length}})</h4>
            <div class="flex flex-wrap gap-1.5">
                <span *ngFor="let rp of role.permissions.slice(0, 6)" class="text-[9px] bg-slate-800/50 text-slate-300 px-2 py-1 rounded border border-slate-700/50 whitespace-nowrap">
                    {{ getPermissionDisplayName(rp.permission.name) }}
                </span>
                <span *ngIf="role.permissions.length > 6" class="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20 whitespace-nowrap">
                    +{{role.permissions.length - 6}} {{ 'role.more' | translate }}
                </span>
            </div>
          </div>

          <div class="flex items-center gap-2 mt-auto pt-4 border-t border-slate-800/50">
             <button 
               (click)="openEditRoleModal(role)"
               class="flex-1 px-3 py-2 bg-blue-600/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-600/20"
             >
                {{ 'role.editRole' | translate }}
             </button>
             <button 
               *ngIf="!role.isSystem"
               (click)="deleteRole(role.id)"
               class="px-3 py-2 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
             >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
             </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && roles.length === 0" class="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-[#334155] rounded-3xl bg-slate-800/20">
            <p class="text-slate-500 mb-4 italic">{{ 'role.noRoles' | translate }}</p>
            <button (click)="openAddRoleModal()" class="text-emerald-500 hover:underline font-bold uppercase text-xs">{{ 'role.createFirstRole' | translate }}</button>
        </div>
      </div>

      <!-- Add/Edit Role Modal -->
      <div *ngIf="isRoleModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="relative bg-[#0f172a] border border-[#334155] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
           
           <div class="p-6 border-b border-[#334155] flex justify-between items-center">
                <div>
                    <h2 class="text-white font-bold text-xl">{{ isEditMode ? (('role.editRoleTitle' | translate) + ': ' + roleData.name) : ('role.createNewRole' | translate) }}</h2>
                    <p class="text-slate-400 text-xs">{{ 'role.roleDescription' | translate }}</p>
                </div>
                <button (click)="closeModal()" class="text-slate-500 hover:text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
           </div>
           
           <div class="flex-grow overflow-y-auto p-8 custom-scrollbar">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Role Name</label>
                            <input [(ngModel)]="roleData.name" [disabled]="!!selectedRole?.isSystem" placeholder="e.g. Finance Manager" class="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none disabled:opacity-50">
                        </div>
                        <div *ngIf="isSuperAdmin && !isEditMode">
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Target Organization</label>
                            <select [(ngModel)]="roleData.targetOrganizationId" class="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none">
                                <option [value]="null">System Role (Available to All Organizations)</option>
                                <option *ngFor="let org of organizations" [value]="org.id">{{org.name}}</option>
                            </select>
                            <p class="text-[10px] text-slate-500 mt-1 italic">Select an organization to create an org-specific role, or leave as "System Role" for a global role.</p>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Description</label>
                            <textarea [(ngModel)]="roleData.description" rows="3" placeholder="Describe the purpose of this role..." class="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none resize-none"></textarea>
                        </div>
                    </div>
                    <div class="bg-emerald-500/5 rounded-xl border border-emerald-500/10 p-6">
                        <h4 class="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Role Permissions
                        </h4>
                        <p class="text-slate-400 text-xs mb-4">Select the specific permissions this role should have. Users assigned to this role will inherit all selected capabilities.</p>
                        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                            <span class="text-slate-500">Selected Permissions:</span>
                            <span class="text-emerald-400">{{roleData.permissions.length}} / {{availablePermissions.length}}</span>
                        </div>
                    </div>
                </div>

                <!-- Permission Checklist by Category -->
                <div class="space-y-8">
                    <div *ngFor="let category of permissionCategories" class="space-y-4">
                        <div class="flex items-center gap-4">
                            <h3 class="text-sm font-bold text-white uppercase tracking-widest">{{category}}</h3>
                            <div class="h-px bg-[#334155] flex-grow"></div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div 
                                *ngFor="let perm of getPermissionsByCategory(category)" 
                                (click)="togglePermission(perm.name)"
                                [class.border-emerald-500]="isPermissionSelected(perm.name)"
                                [class.bg-emerald-500/10]="isPermissionSelected(perm.name)"
                                class="flex items-start gap-3 p-4 bg-[#1e293b] border border-[#334155] rounded-xl cursor-pointer hover:bg-[#2e3b4e] transition-all group"
                            >
                                <div 
                                    [class.bg-emerald-600]="isPermissionSelected(perm.name)"
                                    [class.border-emerald-600]="isPermissionSelected(perm.name)"
                                    class="w-5 h-5 mt-0.5 rounded border border-slate-600 flex items-center justify-center transition-colors group-hover:border-emerald-500"
                                >
                                    <svg *ngIf="isPermissionSelected(perm.name)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                                </div>
                                <div>
                                    <div class="text-xs font-bold text-white mb-0.5 group-hover:text-emerald-400 transition-colors uppercase">{{ getPermissionDisplayName(perm.name) }}</div>
                                    <div class="text-[10px] text-slate-400 leading-relaxed">{{perm.description}}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
           </div>

           <div class="p-6 border-t border-[#334155] flex justify-end gap-3 bg-[#1e293b]/50">
             <button (click)="closeModal()" class="px-6 py-2 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">{{ 'common.cancel' | translate }}</button>
             <button 
                (click)="saveRole()" 
                [disabled]="!roleData.name || roleData.permissions.length === 0"
                class="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
             >
                {{ isEditMode ? ('role.updateRole' | translate) : ('role.createRoleNow' | translate) }}
             </button>
           </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
  `]
})
export class RoleManagementComponent implements OnInit {
    roles: Role[] = [];
    availablePermissions: Permission[] = [];
    permissionCategories: string[] = [];
    organizations: any[] = [];
    isLoading = true;
    isSuperAdmin = false;

    // Modal State
    isRoleModalOpen = false;
    isEditMode = false;
    selectedRole: Role | null = null;

    // Form Data
    roleData = {
        name: '',
        description: '',
        permissions: [] as string[],
        targetOrganizationId: null as number | null
    };

    constructor(
        private readonly roleService: RoleService,
        private readonly organizationService: OrganizationService,
        private readonly authService: AuthService,
        private readonly translationService: TranslationService
    ) { }

    ngOnInit() {
        this.checkUserRole();
        this.loadData();
    }

    getPermissionDisplayName(permissionName: string): string {
        const translationKey = `role.permissionNames.${permissionName}`;
        const translated = this.translationService.translate(translationKey);
        // If translation not found, return formatted name
        if (translated === translationKey) {
            return permissionName.replaceAll('_', ' ');
        }
        return translated;
    }

    checkUserRole() {
        const user = this.authService.getUser();
        if (user) {
            let roleName = '';
            if (user.role) {
                if (typeof user.role === 'string') {
                    roleName = user.role;
                } else if (typeof user.role === 'object' && 'name' in user.role) {
                    roleName = (user.role as any).name || '';
                }
            }
            const roleNameLower = roleName?.toLowerCase() || '';
            this.isSuperAdmin = roleName === 'super_admin' || 
                              roleNameLower === 'super_admin' ||
                              roleName === 'Super Admin' ||
                              roleNameLower === 'super admin' ||
                              roleNameLower === 'superadmin' ||
                              !user.organizationId;
            
            if (this.isSuperAdmin) {
                this.loadOrganizations();
            }
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

    loadData() {
        this.isLoading = true;
        this.roleService.getAllRoles().subscribe({
            next: (data) => {
                this.roles = data;
                this.loadPermissions();
            },
            error: (err) => {
                console.error('Failed to load roles', err);
                this.isLoading = false;
            }
        });
    }

    loadPermissions() {
        this.roleService.getAvailablePermissions().subscribe({
            next: (data) => {
                this.availablePermissions = data;
                // Extract unique categories
                this.permissionCategories = Array.from(new Set(data.map(p => p.category)));
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load permissions', err);
                this.isLoading = false;
            }
        });
    }

    getPermissionsByCategory(category: string): Permission[] {
        return this.availablePermissions.filter(p => p.category === category);
    }

    openAddRoleModal() {
        this.isEditMode = false;
        this.selectedRole = null;
        this.roleData = {
            name: '',
            description: '',
            permissions: [],
            targetOrganizationId: null
        };
        this.isRoleModalOpen = true;
    }

    openEditRoleModal(role: Role) {
        this.isEditMode = true;
        this.selectedRole = role;
        this.roleData = {
            name: role.name,
            description: role.description || '',
            permissions: role.permissions.map(rp => rp.permission.name),
            targetOrganizationId: role.organizationId || null
        };
        this.isRoleModalOpen = true;
    }

    closeModal() {
        this.isRoleModalOpen = false;
    }

    isPermissionSelected(name: string): boolean {
        return this.roleData.permissions.includes(name);
    }

    togglePermission(name: string) {
        if (this.isPermissionSelected(name)) {
            this.roleData.permissions = this.roleData.permissions.filter(p => p !== name);
        } else {
            this.roleData.permissions.push(name);
        }
    }

    saveRole() {
        if (!this.roleData.name || this.roleData.permissions.length === 0) return;

        const rolePayload: any = {
            name: this.roleData.name,
            description: this.roleData.description,
            permissions: this.roleData.permissions
        };

        // Only include targetOrganizationId for super_admin when creating new role
        if (this.isSuperAdmin && !this.isEditMode && this.roleData.targetOrganizationId !== undefined) {
            rolePayload.targetOrganizationId = this.roleData.targetOrganizationId;
        }

        const obs = this.isEditMode && this.selectedRole
            ? this.roleService.updateRole(this.selectedRole.id, rolePayload)
            : this.roleService.createRole(rolePayload);

        obs.subscribe({
            next: () => {
                this.closeModal();
                this.loadData();
            },
            error: (err) => {
                console.error('Failed to save role', err);
                alert(err.error?.error || 'Failed to save role');
            }
        });
    }

    deleteRole(id: number) {
        if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
            this.roleService.deleteRole(id).subscribe({
                next: () => this.loadData(),
                error: (err) => {
                    console.error('Failed to delete role', err);
                    alert(err.error?.error || 'Failed to delete role');
                }
            });
        }
    }
}
