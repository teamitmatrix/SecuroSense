import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { QaParameterService, GlobalQAParameter } from '../../../services/qa-parameter.service';
import { QaTemplateService, QATemplate } from '../../../services/qa-template.service';
import { AuthService } from '../../../services/auth.service';
import { OrganizationService, Organization } from '../../../services/organization.service';

/** Display-ready parameter that may aggregate multiple same-named global entries. */
export interface DisplayQAParameter extends GlobalQAParameter {
    industries: string[]; // All industry tags for this parameter name
}

@Component({
    selector: 'app-qa-parameter-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="p-8 h-full overflow-y-auto custom-scrollbar">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-white mb-1">QA Parameters Library</h1>
          <p class="text-slate-400 text-sm">Manage reusable QA criteria for your templates.</p>
        </div>

        <button
          (click)="openModal()"
          class="px-6 py-2.5 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Add Parameter
        </button>
      </div>


      <!-- Info Banner (for regular admins) -->
      <div *ngIf="!isSuperAdmin && userIndustry" class="mb-6 p-4 bg-emerald-600/10 border border-emerald-600/30 rounded-lg">
        <p class="text-sm text-emerald-300">
          <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Showing parameters for <strong>{{ userIndustry }}</strong> industry. You can see global parameters created by super_admin and your organization's custom parameters.
        </p>
      </div>

      <!-- Grid -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let param of parameters" class="bg-[#1e293b] rounded-xl p-5 border border-[#334155] hover:border-emerald-500/50 transition-all group">
            <div class="flex justify-between items-start mb-3">
                <div class="flex flex-wrap gap-2 items-center">
                    <span *ngFor="let ind of param.industries" class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 uppercase font-bold tracking-tighter">{{ ind }}</span>
                    <!-- Show if parameter is global or organization-specific -->
                    <span *ngIf="!param.organizationId" class="text-[10px] bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded border border-purple-600/30 uppercase font-bold tracking-tighter">
                        Global
                    </span>
                    <span *ngIf="param.organizationId && param.organization" class="text-[10px] bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded border border-blue-600/30 uppercase font-bold tracking-tighter">
                        {{ param.organization.name }}
                    </span>
                </div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button (click)="editParameter(param)" class="text-slate-400 hover:text-white"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button (click)="deleteParameter(param)" class="text-slate-400 hover:text-red-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>

            <h3 class="text-white font-bold text-lg mb-1">{{ param.name }}</h3>
            <p *ngIf="param.nameAr" class="text-slate-400 text-xs mb-2" dir="rtl">{{ param.nameAr }}</p>
            <p class="text-slate-400 text-sm mb-2 line-clamp-2" title="{{param.description}}">{{ param.description }}</p>
            <p *ngIf="param.descriptionAr" class="text-slate-500 text-xs mb-4 line-clamp-2" dir="rtl" title="{{param.descriptionAr}}">{{ param.descriptionAr }}</p>

            <div class="border-t border-slate-700/50 pt-3">
                <p class="text-xs text-slate-500 mb-1 font-semibold uppercase">Pass Criteria</p>
                <p class="text-xs text-emerald-400/80 italic">"{{ param.passCriteria }}"</p>
                <p *ngIf="param.passCriteriaAr" class="text-xs text-slate-500 mt-1 italic" dir="rtl">"{{ param.passCriteriaAr }}"</p>
            </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="parameters.length === 0" class="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-[#334155] rounded-3xl bg-slate-800/20">
            <p class="text-slate-500 mb-2 italic">No parameters found.</p>
            <button (click)="openModal()" class="text-emerald-500 hover:underline text-sm font-bold">Create your first parameter</button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>

      <!-- Modal -->
      <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="relative bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div class="p-6 border-b border-[#334155]">
                <h2 class="text-xl font-bold text-white">{{ isEditMode ? 'Edit Parameter' : 'New Parameter' }}</h2>
            </div>

            <!-- Mode Selection (Only for regular admin, not super_admin, and only when creating new) -->
            <div *ngIf="!isSuperAdmin && !isEditMode" class="p-6 border-b border-[#334155]">
                <div class="flex gap-2">
                    <button
                        (click)="parameterMode = 'template'"
                        [class.bg-emerald-600]="parameterMode === 'template'"
                        [class.bg-slate-700]="parameterMode !== 'template'"
                        [class.text-white]="parameterMode === 'template'"
                        [class.text-slate-300]="parameterMode !== 'template'"
                        class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        Select Template
                    </button>
                    <button
                        (click)="parameterMode = 'existing'"
                        [class.bg-emerald-600]="parameterMode === 'existing'"
                        [class.bg-slate-700]="parameterMode !== 'existing'"
                        [class.text-white]="parameterMode === 'existing'"
                        [class.text-slate-300]="parameterMode !== 'existing'"
                        class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        Select Existing
                    </button>
                    <button
                        (click)="parameterMode = 'custom'"
                        [class.bg-emerald-600]="parameterMode === 'custom'"
                        [class.bg-slate-700]="parameterMode !== 'custom'"
                        [class.text-white]="parameterMode === 'custom'"
                        [class.text-slate-300]="parameterMode !== 'custom'"
                        class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        Create Custom
                    </button>
                </div>
            </div>

            <!-- Select Template (for regular admin only) -->
            <div *ngIf="!isSuperAdmin && !isEditMode && parameterMode === 'template'" class="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <p class="text-sm text-slate-400 mb-4">
                    Select a QA Template for <strong>{{ userIndustry }}</strong> industry. All parameters from the template will be imported:
                </p>

                <div *ngIf="isLoadingTemplates" class="text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                </div>

                <div *ngIf="!isLoadingTemplates && availableTemplates.length === 0" class="text-center py-8 text-slate-500">
                    <p>No templates found for your industry.</p>
                    <button (click)="parameterMode = 'custom'" class="mt-4 text-emerald-500 hover:underline text-sm">
                        Create custom parameters instead
                    </button>
                </div>

                <div *ngIf="!isLoadingTemplates && availableTemplates.length > 0" class="space-y-3">
                    <div
                        *ngFor="let template of availableTemplates"
                        (click)="selectTemplate(template)"
                        class="bg-[#0f172a] border border-[#334155] rounded-lg p-4 cursor-pointer hover:border-emerald-500 transition-all"
                    >
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="text-white font-semibold">{{ template.name }}</h4>
                            <span *ngIf="template.organizationId === null || template.organizationId === undefined" class="text-xs bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded">
                                Global Template
                            </span>
                        </div>
                        <p class="text-sm text-slate-400 mb-2">{{ template.description || 'No description' }}</p>
                        <p class="text-xs text-emerald-400/80">
                            <strong>{{ getTemplateParameterCount(template) }}</strong> parameters
                        </p>
                    </div>
                </div>
            </div>

            <!-- Select Existing Parameters (for regular admin only) -->
            <div *ngIf="!isSuperAdmin && !isEditMode && parameterMode === 'existing'" class="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <p class="text-sm text-slate-400 mb-4">
                    Select from existing parameters for <strong>{{ userIndustry }}</strong> industry:
                </p>

                <div *ngIf="isLoadingExisting" class="text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                </div>

                <div *ngIf="!isLoadingExisting && existingParameters.length === 0" class="text-center py-8 text-slate-500">
                    <p>No existing parameters found for your industry.</p>
                    <button (click)="parameterMode = 'custom'" class="mt-4 text-emerald-500 hover:underline text-sm">
                        Create a custom parameter instead
                    </button>
                </div>

                <div *ngIf="!isLoadingExisting && existingParameters.length > 0" class="space-y-3">
                    <div
                        *ngFor="let param of existingParameters"
                        (click)="selectExistingParameter(param)"
                        class="bg-[#0f172a] border border-[#334155] rounded-lg p-4 cursor-pointer hover:border-emerald-500 transition-all"
                    >
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="text-white font-semibold">{{ param.name }}</h4>
                            <span *ngIf="param.organizationId === null || param.organizationId === undefined" class="text-xs bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded">
                                Global
                            </span>
                        </div>
                        <p class="text-sm text-slate-400 mb-2">{{ param.description }}</p>
                        <p class="text-xs text-emerald-400/80 italic">"{{ param.passCriteria }}"</p>
                    </div>
                </div>
            </div>

            <!-- Create Custom Parameter Form -->
            <div *ngIf="isSuperAdmin || isEditMode || (parameterMode === 'custom' && !isSuperAdmin)" class="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                    <input [(ngModel)]="formData.name" dir="auto" placeholder="e.g. Greeting Protocol" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Name (Arabic) <span class="text-slate-600 font-semibold normal-case">(optional)</span></label>
                    <input [(ngModel)]="formData.nameAr" dir="auto" placeholder="مثال: بروتوكول الترحيب" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                    <textarea [(ngModel)]="formData.description" dir="auto" rows="2" placeholder="Explain what this parameter checks..." class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none resize-none"></textarea>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Arabic) <span class="text-slate-600 font-semibold normal-case">(optional)</span></label>
                    <textarea [(ngModel)]="formData.descriptionAr" dir="auto" rows="2" placeholder="الوصف بالعربية" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none resize-none"></textarea>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Pass Criteria</label>
                    <input [(ngModel)]="formData.passCriteria" dir="auto" placeholder="e.g. Agent must say 'Hello' within 5s" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Pass Criteria (Arabic) <span class="text-slate-600 font-semibold normal-case">(optional)</span></label>
                    <input [(ngModel)]="formData.passCriteriaAr" dir="auto" placeholder="معايير النجاح بالعربية" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Weight (1-10)</label>
                    <input type="number" min="1" max="10" [(ngModel)]="formData.weight" class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none">
                </div>

                <!-- Industry Selection (for super_admin only) -->
                <div *ngIf="isSuperAdmin">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Industry *</label>
                    <select
                        [(ngModel)]="formData.industry"
                        class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                    >
                        <option value="">Select Industry</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Banking">Banking</option>
                        <option value="Retail">Retail</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Technology">Technology</option>
                        <option value="General">General</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <!-- Organization Selection (for super_admin only) -->
                <div *ngIf="isSuperAdmin">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Assign to Organization (Optional)</label>
                    <select
                        [(ngModel)]="formData.organizationId"
                        class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                    >
                        <option [ngValue]="null">Global Parameter (All Organizations)</option>
                        <option *ngFor="let org of organizations" [ngValue]="org.id">{{ org.name }} ({{ org.industry }})</option>
                    </select>
                    <p class="text-xs text-slate-500 mt-1">
                        Select an organization to create an organization-specific parameter, or leave as "Global" for all organizations.
                    </p>
                </div>

                <!-- Info for regular admin -->
                <div *ngIf="!isSuperAdmin" class="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <p class="text-xs text-slate-400 italic">
                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Industry will be automatically set based on your organization's industry.
                    </p>
                </div>
            </div>

            <div class="p-6 border-t border-[#334155] flex justify-end gap-3 bg-[#1e293b]/50">
                <button (click)="closeModal()" class="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">Cancel</button>
                <button
                    *ngIf="isSuperAdmin || isEditMode || parameterMode === 'custom'"
                    (click)="saveParameter()"
                    [disabled]="!formData.name || !formData.passCriteria || (isSuperAdmin && !formData.industry)"
                    class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save Parameter
                </button>
                <button
                    *ngIf="!isSuperAdmin && !isEditMode && parameterMode === 'template' && selectedTemplate"
                    (click)="importTemplateParameters()"
                    [disabled]="isImporting"
                    class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <span *ngIf="isImporting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Import All Parameters
                </button>
            </div>
        </div>
      </div>

      <!-- Bulk Import Modal -->
      <div *ngIf="isBulkModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeBulkModal()"></div>
        <div class="relative bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div class="p-6 border-b border-[#334155]">
                <h2 class="text-xl font-bold text-white">Bulk Import Parameters</h2>
                <p class="text-sm text-slate-400 mt-1">Paste your parameters list (one per line). Each line will become a parameter with the text as Pass Criteria.</p>
            </div>

            <div class="p-6 flex-1 overflow-y-auto custom-scrollbar">
                <div class="mb-4">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Parameters List (One per line)</label>
                    <textarea
                        [(ngModel)]="bulkImportText"
                        rows="12"
                        placeholder="Paste your parameters here, one per line. Example:&#10;Ask all Health / Knockout Questions clearly and properly.&#10;Verify the OTP question if you are writing Aetna.&#10;Ensure a valid mode of payment is confirmed before quoting prices."
                        class="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none resize-none font-mono text-sm"
                    ></textarea>
                    <p class="text-xs text-slate-500 mt-2">
                        <strong>Format:</strong> Each line will be treated as a separate parameter. The line text will be used as both Name and Pass Criteria.
                    </p>
                </div>

                <!-- Preview -->
                <div *ngIf="bulkImportText.trim()" class="mt-6">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Preview ({{ getBulkParameters().length }} parameters)</label>
                    <div class="bg-[#0f172a] border border-[#334155] rounded-lg p-4 max-h-64 overflow-y-auto custom-scrollbar">
                        <div *ngFor="let param of getBulkParameters(); let i = index" class="mb-3 pb-3 border-b border-[#334155] last:border-0">
                            <div class="flex items-start gap-2">
                                <span class="text-xs text-slate-500 font-mono w-6">{{ i + 1 }}.</span>
                                <div class="flex-1">
                                    <p class="text-sm text-white font-medium">{{ param.name }}</p>
                                    <p class="text-xs text-slate-400 mt-1 italic">"{{ param.passCriteria }}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-6 border-t border-[#334155] flex justify-end gap-3 bg-[#1e293b]/50">
                <button (click)="closeBulkModal()" class="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">Cancel</button>
                <button
                    (click)="saveBulkParameters()"
                    [disabled]="!bulkImportText.trim() || isBulkImporting"
                    class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <span *ngIf="isBulkImporting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Import {{ getBulkParameters().length }} Parameter(s)
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
  `]
})
export class QaParameterManagementComponent implements OnInit {
    parameters: DisplayQAParameter[] = [];
    isLoading = false;
    userIndustry: string | null = null;
    isSuperAdmin = false;
    organizations: Organization[] = [];

    // For regular admin: mode selection
    parameterMode: 'template' | 'existing' | 'custom' = 'template'; // Default to 'template' for regular admin
    existingParameters: GlobalQAParameter[] = [];
    isLoadingExisting = false;

    // Template selection
    availableTemplates: QATemplate[] = [];
    isLoadingTemplates = false;
    selectedTemplate: QATemplate | null = null;
    isImporting = false;

    // Bulk import
    isBulkModalOpen = false;
    bulkImportText = '';
    isBulkImporting = false;

    isModalOpen = false;
    isEditMode = false;
    selectedId: number | null = null;

    formData = {
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        passCriteria: '',
        passCriteriaAr: '',
        weight: 1,
        industry: '' as string | undefined,
        organizationId: null as number | null | undefined
    };

    constructor(
        private readonly qaParamService: QaParameterService,
        private readonly qaTemplateService: QaTemplateService,
        private readonly authService: AuthService,
        private readonly organizationService: OrganizationService
    ) { }

    ngOnInit() {
        this.loadUserInfo();
    }

    loadUserInfo() {
        const user = this.authService.getUser();
        const normalizedRole = this.authService.getNormalizedRole();
        this.isSuperAdmin = normalizedRole === 'super_admin' || !user?.organizationId;

        if (!this.isSuperAdmin && user?.organizationId) {
            // Load organization to get industry
            this.organizationService.getOrganizationById(user.organizationId).subscribe({
                next: (org) => {
                    this.userIndustry = org.industry;
                    this.loadData();
                },
                error: () => {
                    // If error, still try to load data without industry filter
                    this.loadData();
                }
            });
        } else {
            // Super admin - load all parameters and organizations
            this.loadOrganizations();
            this.loadData();
        }
    }

    loadOrganizations(): void {
        this.organizationService.getAllOrganizations().subscribe({
            next: (orgs) => {
                this.organizations = orgs;
            },
            error: (err) => {
                console.error('Error loading organizations', err);
            }
        });
    }

    loadData() {
        this.isLoading = true;
        // For regular admin, filter by their organization's industry
        // For super_admin, show all parameters
        const industry = this.isSuperAdmin ? undefined : (this.userIndustry || undefined);

        this.qaParamService.getAll(industry).subscribe({
            next: (data) => {
                this.parameters = this.deduplicateForDisplay(data);
                this.isLoading = false;
            },
            error: () => this.isLoading = false
        });
    }

    /**
     * Deduplicate parameters for display:
     * - Org-specific params (organizationId != null) are always shown as-is.
     * - Global params (organizationId == null) with the same name are merged into
     *   one card with all their industry tags collected into `industries`.
     */
    private deduplicateForDisplay(data: GlobalQAParameter[]): DisplayQAParameter[] {
        const globalMap = new Map<string, DisplayQAParameter>();
        const result: DisplayQAParameter[] = [];

        for (const param of data) {
            if (param.organizationId != null) {
                // Org-specific — always show individually
                result.push({ ...param, industries: [param.industry] });
                continue;
            }
            const key = param.name.toLowerCase().trim();
            if (globalMap.has(key)) {
                // Merge industry into existing card
                const existing = globalMap.get(key)!;
                if (!existing.industries.includes(param.industry)) {
                    existing.industries.push(param.industry);
                }
            } else {
                const display: DisplayQAParameter = { ...param, industries: [param.industry] };
                globalMap.set(key, display);
                result.push(display);
            }
        }
        return result;
    }

    openModal() {
        this.isEditMode = false;
        this.selectedId = null;
        this.parameterMode = this.isSuperAdmin ? 'custom' : 'template'; // Super admin always uses custom mode
        this.selectedTemplate = null;
        this.formData = {
            name: '',
            nameAr: '',
            description: '',
            descriptionAr: '',
            passCriteria: '',
            passCriteriaAr: '',
            weight: 1,
            industry: undefined,
            organizationId: null
        };
        this.isModalOpen = true;

        // Load templates for regular admin
        if (!this.isSuperAdmin) {
            // Use type assertion to avoid TypeScript narrowing issues
            const mode = this.parameterMode as 'template' | 'existing' | 'custom';
            if (mode === 'template') {
                this.loadAvailableTemplates();
            } else if (mode === 'existing') {
                this.loadExistingParameters();
            }
        }
    }

    loadAvailableTemplates() {
        this.isLoadingTemplates = true;
        // Fetch ALL global templates regardless of industry so Arabic and other
        // locale-specific templates are also visible to the org admin.
        this.qaTemplateService.getAllTemplates(undefined, false).subscribe({
            next: (templates) => {
                // Show only global templates (organizationId = null) that have parameters
                this.availableTemplates = templates.filter(t =>
                    (t.organizationId === null || t.organizationId === undefined) &&
                    t.isActive &&
                    t.parameters &&
                    Array.isArray(t.parameters) &&
                    t.parameters.length > 0
                );
                this.isLoadingTemplates = false;
            },
            error: (err) => {
                console.error('Error loading templates:', err);
                this.isLoadingTemplates = false;
            }
        });
    }

    selectTemplate(template: QATemplate) {
        this.selectedTemplate = template;
    }

    importTemplateParameters() {
        if (!this.selectedTemplate?.parameters || !Array.isArray(this.selectedTemplate.parameters)) {
            alert('No parameters found in this template');
            return;
        }

        if (!confirm(`Import all ${this.selectedTemplate.parameters.length} parameters from "${this.selectedTemplate.name}"?`)) {
            return;
        }

        this.isImporting = true;

        // Import all parameters from the template
        const parameters = this.selectedTemplate.parameters as Array<{
            name: string;
            description: string;
            passCriteria: string;
            weight?: number;
        }>;

        const importPromises = parameters.map(param => {
            const data: any = {
                name: param.name,
                description: param.description || param.name,
                passCriteria: param.passCriteria || param.description || param.name,
                weight: param.weight || 1
                // organizationId will be set automatically by backend based on user's organization
            };

            return firstValueFrom(this.qaParamService.create(data));
        });

        Promise.all(importPromises)
            .then(() => {
                const templateName = this.selectedTemplate?.name || 'template';
                alert(`Successfully imported ${parameters.length} parameter(s) from "${templateName}"!`);
                this.closeModal();
                this.loadData();
                this.isImporting = false;
            })
            .catch((err) => {
                console.error('Error importing template parameters', err);
                alert(`Error importing parameters: ${err.error?.error || err.error?.message || 'Unknown error'}`);
                this.isImporting = false;
            });
    }

    loadExistingParameters() {
        if (!this.userIndustry) return;

        this.isLoadingExisting = true;
        this.qaParamService.getAll(this.userIndustry).subscribe({
            next: (data) => {
                console.log('Loaded parameters for industry:', this.userIndustry, 'Total:', data.length, 'Data:', data);
                // Filter out parameters that already belong to this organization
                // Show only global parameters (organizationId = null or undefined) that can be imported
                this.existingParameters = data.filter(p => {
                    const isGlobal = p.organizationId === null || p.organizationId === undefined;
                    console.log('Parameter:', p.name, 'organizationId:', p.organizationId, 'isGlobal:', isGlobal);
                    return isGlobal;
                });
                console.log('Filtered global parameters:', this.existingParameters.length);
                this.isLoadingExisting = false;
            },
            error: (err) => {
                console.error('Error loading existing parameters:', err);
                this.isLoadingExisting = false;
            }
        });
    }

    selectExistingParameter(param: GlobalQAParameter) {
        // Import the parameter by creating a copy for this organization
        const importData = {
            name: param.name,
            description: param.description,
            passCriteria: param.passCriteria,
            weight: param.weight
            // organizationId will be set automatically by backend based on user's organization
        };

        this.qaParamService.create(importData).subscribe({
            next: () => {
                alert(`Parameter "${param.name}" imported successfully!`);
                this.closeModal();
                this.loadData();
            },
            error: (err) => {
                console.error('Error importing parameter', err);
                alert(err.error?.error || err.error?.message || 'Failed to import parameter');
            }
        });
    }

    editParameter(param: GlobalQAParameter) {
        this.isEditMode = true;
        this.selectedId = param.id;
        this.formData = {
            name: param.name,
            nameAr: param.nameAr || '',
            description: param.description,
            descriptionAr: param.descriptionAr || '',
            passCriteria: param.passCriteria,
            passCriteriaAr: param.passCriteriaAr || '',
            weight: param.weight,
            industry: param.industry,
            organizationId: param.organizationId || null
        };
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    saveParameter() {
        if (!this.formData.name) return;

        // For super_admin, industry is required
        if (this.isSuperAdmin && !this.formData.industry) {
            alert('Please select an industry');
            return;
        }

        // Prepare data for API
        const apiData: any = {
            name: this.formData.name,
            nameAr: this.formData.nameAr || undefined,
            description: this.formData.description,
            descriptionAr: this.formData.descriptionAr || undefined,
            passCriteria: this.formData.passCriteria,
            passCriteriaAr: this.formData.passCriteriaAr || undefined,
            weight: this.formData.weight
        };

        // For super_admin, include industry and organizationId
        if (this.isSuperAdmin) {
            apiData.industry = this.formData.industry;
            if (this.formData.organizationId !== null && this.formData.organizationId !== undefined) {
                apiData.organizationId = this.formData.organizationId;
            }
        }

        const obs = this.isEditMode && this.selectedId
            ? this.qaParamService.update(this.selectedId, apiData)
            : this.qaParamService.create(apiData);

        obs.subscribe({
            next: () => {
                this.closeModal();
                this.loadData();
            },
            error: (err) => {
                console.error('Error saving parameter', err);
                alert(err.error?.error || err.error?.message || 'Failed to save parameter');
            }
        });
    }

    deleteParameter(param: GlobalQAParameter) {
        if (confirm(`Delete "${param.name}"?`)) {
            this.qaParamService.delete(param.id).subscribe(() => this.loadData());
        }
    }

    openBulkModal() {
        this.bulkImportText = '';
        this.isBulkModalOpen = true;
    }

    closeBulkModal() {
        this.isBulkModalOpen = false;
        this.bulkImportText = '';
    }

    getBulkParameters(): Array<{ name: string; passCriteria: string; description: string }> {
        if (!this.bulkImportText.trim()) {
            return [];
        }

        const lines = this.bulkImportText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        return lines.map(line => {
            // Use first 50 chars as name, full text as pass criteria
            const name = line.length > 50 ? line.substring(0, 47) + '...' : line;
            return {
                name: name,
                passCriteria: line,
                description: `QA parameter: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`
            };
        });
    }

    getTemplateParameterCount(template: QATemplate): number {
        return (template.parameters && Array.isArray(template.parameters)) ? template.parameters.length : 0;
    }

    saveBulkParameters() {
        const parameters = this.getBulkParameters();
        if (parameters.length === 0) {
            return;
        }

        this.isBulkImporting = true;

        // Create all parameters sequentially
        const createPromises = parameters.map(param => {
            const data: any = {
                name: param.name,
                description: param.description,
                passCriteria: param.passCriteria,
                weight: 1
            };

            // For super_admin, add industry and organizationId if needed
            if (this.isSuperAdmin) {
                if (this.formData.industry) {
                    data.industry = this.formData.industry;
                }
                if (this.formData.organizationId !== null && this.formData.organizationId !== undefined) {
                    data.organizationId = this.formData.organizationId;
                }
            }

            return firstValueFrom(this.qaParamService.create(data));
        });

        // Execute all creates
        Promise.all(createPromises)
            .then(() => {
                alert(`Successfully imported ${parameters.length} parameter(s)!`);
                this.closeBulkModal();
                this.loadData();
                this.isBulkImporting = false;
            })
            .catch((err) => {
                console.error('Error importing parameters', err);
                alert(`Error importing parameters: ${err.error?.error || err.error?.message || 'Unknown error'}`);
                this.isBulkImporting = false;
            });
    }
}
