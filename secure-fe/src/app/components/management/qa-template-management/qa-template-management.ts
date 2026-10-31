import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QaTemplateService, QATemplate, CreateQATemplateInput } from '../../../services/qa-template.service';
import { PermissionService, PERMISSIONS } from '../../../services/permission.service';
import { AuthService } from '../../../services/auth.service';
import { OrganizationService, Organization } from '../../../services/organization.service';

@Component({
    selector: 'app-qa-template-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="p-8 h-full overflow-y-auto">
      <!-- Header -->
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-semibold text-white mb-1">QA Template Management</h1>
          <p class="text-slate-400 text-sm">Create and manage customizable quality assurance templates</p>
        </div>
        
        <button 
          *ngIf="isSuperAdmin || canManage"
          (click)="openCreateModal()"
          class="px-6 py-2.5 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-95"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          {{ isSuperAdmin ? 'New Template' : 'Create My QA Template' }}
        </button>
      </div>

      <!-- Industry Filter -->
      <div class="mb-6">
        <div class="flex items-center gap-4">
          <label class="text-sm text-slate-300">Filter by Industry:</label>
          <select 
            [(ngModel)]="selectedIndustry"
            (change)="loadTemplates()"
            class="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Industries</option>
            <option value="Finance">Finance</option>
            <option value="Insurance">Insurance</option>
            <option value="Banking">Banking</option>
            <option value="Retail">Retail</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Technology">Technology</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <!-- Templates Grid -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          *ngFor="let template of templates"
          class="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-emerald-500 transition-all"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-semibold text-white">{{template.name}}</h3>
              <p *ngIf="template.nameAr" class="text-xs text-slate-400 mt-1" dir="auto">{{ template.nameAr }}</p>
              <span class="inline-block mt-2 px-3 py-1 bg-emerald-600/20 text-emerald-400 text-xs rounded-full">
                {{template.industry}}
              </span>
            </div>
            <div class="flex gap-2">
              <!-- Select/Copy Button for Organization Admin (on global templates) -->
              <button 
                *ngIf="isOrganizationAdmin && (!template.organizationId || template.organizationId === null)"
                (click)="selectTemplate(template)"
                class="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-all"
                title="Select this template for your organization"
              >
                Select
              </button>
              
              <!-- Edit/Delete buttons (for owners) -->
              <button 
                *ngIf="canEditTemplate(template)"
                (click)="editTemplate(template)"
                class="p-2 text-slate-400 hover:text-white transition-colors"
                title="Edit"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button 
                *ngIf="canEditTemplate(template)"
                (click)="deleteTemplate(template)"
                class="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>

          <p class="text-sm text-slate-400 mb-4">{{template.description || 'No description'}}</p>

          <!-- Template Type (for super_admin) -->
          <div *ngIf="isSuperAdmin && template.organization" class="mb-4 p-3 bg-slate-700/30 rounded border border-slate-600">
            <p class="text-xs text-slate-400 mb-1 font-semibold">Created for Organization:</p>
            <span class="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded">
              {{template.organization.name}}
            </span>
            <p class="text-xs text-slate-500 mt-2 italic">This template was created specifically for this organization. They can copy it to use it.</p>
          </div>
          <div *ngIf="isSuperAdmin && !template.organization" class="mb-4 p-3 bg-slate-700/20 rounded border border-slate-600/50">
            <p class="text-xs text-slate-500 italic">Global Template - Available for all organizations to copy and use</p>
            <!-- Show organizations that have actually copied this template -->
            <div *ngIf="template.organizationsUsing && template.organizationsUsing.length > 0" class="mt-3 pt-3 border-t border-slate-600">
              <p class="text-xs text-slate-400 mb-2 font-semibold">Organizations Using This Template ({{template.usageCount || template.organizationsUsing.length}}):</p>
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let org of template.organizationsUsing" class="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-300 rounded">
                  {{org.name}}
                </span>
              </div>
            </div>
            <div *ngIf="!template.organizationsUsing || template.organizationsUsing.length === 0" class="mt-2">
              <p class="text-xs text-slate-600 italic">No organizations have copied this template yet</p>
            </div>
          </div>


          <div class="border-t border-slate-700 pt-4">
            <p class="text-xs text-slate-500 mb-2">{{template.parameters.length}} QA Parameters:</p>
            <ul class="space-y-1">
              <li *ngFor="let param of template.parameters.slice(0, 3)" class="text-xs text-slate-400 flex items-start">
                <svg class="w-3 h-3 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                {{param.description || param.name}}
              </li>
              <li *ngIf="template.parameters.length > 3" class="text-xs text-slate-500 italic ml-5">
                +{{template.parameters.length - 3}} more...
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && templates.length === 0" class="text-center py-20">
        <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p class="text-slate-400 text-lg mb-2">No templates found</p>
        <p class="text-slate-500 text-sm">Create your first QA template to get started</p>
      </div>

      <!-- Create/Edit Modal -->
      <div 
        *ngIf="isModalOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="closeModal()"
      >
        <div 
          class="bg-slate-900 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div class="border-b border-slate-700 px-6 py-4">
            <h2 class="text-xl font-semibold text-white">{{editingTemplate ? 'Edit Template' : 'Create New Template'}}</h2>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
            <!-- Basic Info -->
            <div class="space-y-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Template Name*</label>
                <input 
                  type="text"
                  [(ngModel)]="formData.name"
                  dir="auto"
                  placeholder="e.g., Software Sales Call"
                  class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Template Name (Arabic) <span class="text-slate-500 text-xs">(optional)</span></label>
                <input 
                  type="text"
                  [(ngModel)]="formData.nameAr"
                  dir="auto"
                  placeholder="مثال: قالب مكالمات المبيعات"
                  class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Industry*</label>
                <select 
                  [(ngModel)]="formData.industry"
                  class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select Industry</option>
                  <option value="Finance">Finance</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Banking">Banking</option>
                  <option value="Retail">Retail</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Technology">Technology</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea 
                  [(ngModel)]="formData.description"
                  dir="auto"
                  rows="3"
                  placeholder="Brief description of this template..."
                  class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                ></textarea>
              </div>

              <!-- Organization Selection (for super_admin only) -->
              <div *ngIf="isSuperAdmin">
                <label class="block text-sm font-medium text-slate-300 mb-2">Assign to Organization (Optional)</label>
                <select 
                  [(ngModel)]="formData.organizationId"
                  class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option [ngValue]="null">Global Template (All Organizations)</option>
                  <option *ngFor="let org of organizations" [ngValue]="org.id">{{ org.name }} ({{ org.industry }})</option>
                </select>
                <p class="text-xs text-slate-500 mt-1">
                  Select an organization to create an organization-specific template, or leave as "Global" for all organizations.
                </p>
              </div>
            </div>

            <!-- QA Parameters -->
            <div class="border-t border-slate-700 pt-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-white">QA Parameters</h3>
                <button 
                  (click)="addParameter()"
                  class="px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-md text-sm hover:bg-emerald-600/30 transition-all flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  Add Parameter
                </button>
              </div>

              <div class="space-y-3">
                <div 
                  *ngFor="let param of formData.parameters; let i = index"
                  class="flex items-start gap-3"
                >
                  <div class="flex-1">
                    <input 
                      type="text"
                      [(ngModel)]="param.description"
                      dir="auto"
                      [placeholder]="'Parameter ' + (i + 1) + ' (e.g., Ask all Health / Knockout Questions clearly and properly.)'"
                      class="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <button 
                    (click)="removeParameter(i)"
                    class="p-2 text-red-400 hover:text-red-300 transition-colors mt-0.5"
                    title="Remove parameter"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                <div *ngIf="formData.parameters.length === 0" class="text-center py-8 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                  <p class="mb-2">No parameters added yet.</p>
                  <p class="text-xs text-slate-600">Click "Add Parameter" to add QA criteria</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
            <button 
              (click)="closeModal()"
              class="px-4 py-2 bg-slate-800 text-slate-300 rounded-md text-sm hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button 
              (click)="saveTemplate()"
              [disabled]="isSaving || !isFormValid()"
              class="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span *ngIf="isSaving" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              {{editingTemplate ? 'Update Template' : 'Create Template'}}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
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
export class QaTemplateManagementComponent implements OnInit {
    templates: QATemplate[] = [];
    isLoading = false;
    isSaving = false;
    selectedIndustry = '';

    // Modal state
    isModalOpen = false;
    editingTemplate: QATemplate | null = null;

    // Form data
    formData: CreateQATemplateInput = {
        name: '',
        nameAr: null,
        industry: '',
        description: '',
        parameters: [],
        organizationId: null // Default to global template
    };

    // Permissions
    canView = false;
    canManage = false;
    isSuperAdmin = false;
    isOrganizationAdmin = false;
    organizations: Organization[] = [];

    constructor(
        private readonly qaTemplateService: QaTemplateService,
        private readonly permissionService: PermissionService,
        private readonly authService: AuthService,
        private readonly organizationService: OrganizationService
    ) { }

    ngOnInit(): void {
        this.checkPermissions();
        if (this.isSuperAdmin) {
            this.loadOrganizations();
        }
        if (this.canView || this.isSuperAdmin) {
            this.loadTemplates();
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

    checkPermissions(): void {
        this.canView = this.permissionService.hasPermission(PERMISSIONS.VIEW_QA_TEMPLATES);
        // Super_admin can manage all templates, Organization Admin can manage their own
        this.canManage = this.permissionService.hasPermission(PERMISSIONS.MANAGE_ORGANIZATIONS) || 
                         this.permissionService.hasPermission(PERMISSIONS.VIEW_QA_TEMPLATES);
        
        // Check user role
        const user = this.authService.getUser();
        const normalizedRole = this.authService.getNormalizedRole();
        this.isSuperAdmin = normalizedRole === 'super_admin' || !user?.organizationId;
        this.isOrganizationAdmin = !this.isSuperAdmin && !!user?.organizationId;
    }

    loadTemplates(): void {
        this.isLoading = true;
        const industry = this.selectedIndustry || undefined;
        // For super_admin, include organization details
        const includeUsage = this.isSuperAdmin;

        this.qaTemplateService.getAllTemplates(industry, includeUsage).subscribe({
            next: (templates) => {
                this.templates = templates;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading templates', err);
                this.isLoading = false;
            }
        });
    }

    openCreateModal(): void {
        this.editingTemplate = null;
        this.formData = {
            name: '',
            nameAr: null,
            industry: '',
            description: '',
            parameters: [],
            organizationId: null // Default to global template
        };
        this.isModalOpen = true;
    }

    editTemplate(template: QATemplate): void {
        this.editingTemplate = template;
        this.formData = {
            name: template.name,
            nameAr: template.nameAr || null,
            industry: template.industry,
            description: template.description || '',
            parameters: structuredClone(template.parameters), // Deep copy
            organizationId: template.organizationId || null
        };
        this.isModalOpen = true;
    }

    deleteTemplate(template: QATemplate): void {
        if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
            return;
        }

        this.qaTemplateService.deleteTemplate(template.id).subscribe({
            next: () => {
                this.loadTemplates();
            },
            error: (err) => {
                console.error('Error deleting template', err);
                alert('Failed to delete template');
            }
        });
    }

    addParameter(): void {
        this.formData.parameters.push({
            name: '', // Will be auto-generated from description
            description: '', // Main input field
            passCriteria: '' // Will be auto-generated from description
        });
    }

    removeParameter(index: number): void {
        this.formData.parameters.splice(index, 1);
    }

    isFormValid(): boolean {
        if (!this.formData.name || !this.formData.industry) return false;
        if (this.formData.parameters.length === 0) return false;

        // For simple input: only description is required, name and passCriteria will be auto-generated
        return this.formData.parameters.every(p => p.description && p.description.trim().length > 0);
    }

    saveTemplate(): void {
        if (!this.isFormValid()) return;

        this.isSaving = true;

        // Process parameters: Auto-generate name and passCriteria from description
        const processedParameters = this.formData.parameters.map(param => {
            const description = param.description.trim();
            // Use first 50 chars as name, full description as passCriteria
            return {
                name: description.length > 50 ? description.substring(0, 50) + '...' : description,
                description: description,
                passCriteria: description // Same as description for simplicity
            };
        });

        const templateData = {
            ...this.formData,
            parameters: processedParameters
        };

        const request$ = this.editingTemplate
            ? this.qaTemplateService.updateTemplate(this.editingTemplate.id, templateData)
            : this.qaTemplateService.createTemplate(templateData);

        request$.subscribe({
            next: () => {
                this.isSaving = false;
                this.closeModal();
                this.loadTemplates();
            },
            error: (err) => {
                console.error('Error saving template', err);
                this.isSaving = false;
                alert('Failed to save template');
            }
        });
    }

    selectTemplate(template: QATemplate): void {
        if (!confirm(`Copy "${template.name}" to your organization? You can then edit it as needed.`)) {
            return;
        }

        this.isSaving = true;
        this.qaTemplateService.copyTemplateToOrganization(template.id).subscribe({
            next: () => {
                this.isSaving = false;
                alert('Template copied successfully! You can now edit it.');
                this.loadTemplates();
            },
            error: (err) => {
                console.error('Error copying template', err);
                this.isSaving = false;
                alert('Failed to copy template');
            }
        });
    }

    canEditTemplate(template: QATemplate): boolean {
        if (this.isSuperAdmin) return true;
        if (!this.isOrganizationAdmin) return false;
        
        const user = this.authService.getUser();
        // Organization admin can edit their own organization's templates
        return template.organizationId === user?.organizationId;
    }

    closeModal(): void {
        this.isModalOpen = false;
        this.editingTemplate = null;
    }
}
