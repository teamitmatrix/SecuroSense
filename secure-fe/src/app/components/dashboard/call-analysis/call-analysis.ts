import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallAnalysisService } from '../../../services/call-analysis.service';
import { Call, Lead, PaginatedLeads } from '../../../models/models';
import { AuthService } from '../../../services/auth.service';
import { OrganizationService } from '../../../services/organization.service';
import { TeamService } from '../../../services/team.service';

// Sub-components

import { LeadsTableComponent } from './leads-table';
import { UploadModalComponent } from './upload-modal';
import { LeadDetailsModalComponent } from './lead-details-modal';
import { CallDetailModalComponent } from './call-detail-modal';
import { TranscriptModalComponent } from './transcript-modal';

import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-call-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LeadsTableComponent,
    UploadModalComponent,
    LeadDetailsModalComponent,
    CallDetailModalComponent,
    TranscriptModalComponent,
    TranslatePipe
  ],
  template: `
    <div class="p-8 h-full overflow-y-auto" [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      <!-- Header -->
      <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" [class.flex-row-reverse]="translationService.isRTL()">
        <div [class.text-right]="translationService.isRTL()">
          <h1 class="text-3xl font-semibold text-white mb-1">{{ 'callAnalysis.title' | translate }}</h1>
          <p class="text-slate-400 text-sm">{{ 'callAnalysis.subtitle' | translate }}</p>
        </div>

        <!-- Organization Filter (Super Admin Only) -->
        <div *ngIf="isSuperAdmin && organizations.length > 0" class="flex items-center gap-3" [class.flex-row-reverse]="translationService.isRTL()">
          <label class="text-sm text-slate-300">{{ 'callAnalysis.selectOrganization' | translate }}:</label>
          <select
            [(ngModel)]="selectedOrganizationId"
            (change)="onOrganizationChange()"
            class="bg-[#1e293b] border border-[#334155] text-slate-200 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-w-[200px]">
            <option [value]="null">{{ 'callAnalysis.allOrganizations' | translate }}</option>
            <option *ngFor="let org of organizations" [value]="org.id">{{ org.name }}</option>
          </select>
        </div>

        <!-- Action Button -->
        <div class="flex items-center gap-4">
          <button
            (click)="openUploadModal()"
            class="px-6 py-2.5 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-95"
            [class.flex-row-reverse]="translationService.isRTL()"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            {{ 'callAnalysis.uploadNewRecording' | translate }}
          </button>
        </div>
      </div>


      <app-leads-table
        [leads]="leads"
        [isLoading]="isLoading"
        [currentPage]="currentPage"
        [pageSize]="pageSize"
        [totalItems]="totalItems"
        [totalPages]="totalPages"
        [pages]="getPages()"
        (viewLead)="openLeadDetails($event)"
        (prevPage)="prevPage()"
        (nextPage)="nextPage()"
        (goToPage)="goToPage($event)"
      ></app-leads-table>

      <app-lead-details-modal
        *ngIf="isLeadDetailsModalOpen"
        [lead]="selectedLead"
        [complianceScore]="getComplianceScore()"
        [avgScore]="getAvgScore()"
        (modalClose)="closeLeadDetails()"
        (viewCall)="openCallDetails($event)"
        (downloadPdf)="downloadPdf($event)"
        (addInteraction)="openUploadModal($event)"
      ></app-lead-details-modal>

      <app-upload-modal
        *ngIf="isUploadModalOpen"
        [metadata]="uploadMetadata"
        [selectedFiles]="selectedFiles"
        [isUploading]="isUploading"
        [progress]="uploadProgress"
        [errors]="uploadErrors"
        [isDragging]="isDragging"
        [agents]="agents"
        [fileAgents]="fileAgents"
        (modalClose)="closeUploadModal()"
        (cancelUploadClicked)="cancelUpload()"
        (filesSelected)="addFiles($event)"
        (fileRemoved)="removeFile($event)"
        (clearFiles)="selectedFiles = []; fileAgents = []"
        (upload)="startUpload()"
        (draggingChanged)="isDragging = $event"
        (agentChanged)="onAgentChange($event)"
      ></app-upload-modal>

      <app-call-detail-modal
        *ngIf="isModalOpen"
        [call]="selectedCall"
        (close)="closeModal()"
        (downloadPdf)="downloadPdf($event)"
        (viewTranscript)="openTranscriptModal($event)"
      ></app-call-detail-modal>

      <app-transcript-modal
        *ngIf="isTranscriptModalOpen"
        [call]="selectedCall"
        [language]="transcriptLanguage"
        (close)="isTranscriptModalOpen = false"
      ></app-transcript-modal>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
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
    @keyframes pulse-width {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
    }
    .animate-pulse-width {
        animation: pulse-width 3s ease-in-out infinite;
    }
  `]
})
export class CallAnalysisComponent implements OnInit {
  leads: Lead[] = [];
  calls: Call[] = []; // Current interactive history for selected lead
  isLoading = false;
  isUploading = false;
  private cancelRequested = false;

  // Organization filtering
  isSuperAdmin = false;
  organizations: any[] = [];
  selectedOrganizationId: number | null = null;
  userOrganizationId: number | null = null;

  // Agents list
  agents: any[] = [];

  // Pagination State
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  Math = Math;

  // Modal State
  isModalOpen = false;
  isUploadModalOpen = false;
  isLeadDetailsModalOpen = false;
  isTranscriptModalOpen = false;
  transcriptLanguage: 'en' | 'ar' = 'en';
  selectedLead: Lead | null = null;
  selectedCall: Call | null = null;

  // Upload State
  selectedFiles: File[] = [];
  uploadProgress = { current: 0, total: 0 };
  uploadErrors: string[] = [];
  isDragging = false;
  fileAgents: (number | null)[] = []; // Agent ID for each file by index
  uploadMetadata = {
    customerName: '',
    customerNameAr: '',
    customerNumber: '',
    leadId: undefined as number | undefined
  };

  constructor(
    private readonly callAnalysisService: CallAnalysisService,
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
    private readonly teamService: TeamService,
    public readonly translationService: TranslationService
  ) { }

  ngOnInit(): void {
    const user: any = this.authService.getUser();
    if (user) {
      this.isSuperAdmin = !user.organizationId;
      this.userOrganizationId = user.organizationId || null;

      // Check if user is an Agent
      const userRole = user.role?.name || user.role || '';
      const isAgent = userRole === 'Agent' || userRole.toLowerCase() === 'agent';

      // For regular admins, use their organizationId automatically
      if (!this.isSuperAdmin && this.userOrganizationId) {
        this.selectedOrganizationId = this.userOrganizationId;
      }

      // Load organizations for super_admin only
      if (this.isSuperAdmin) {
        this.loadOrganizations();
      }

      // For agents, don't load agents list (they only see their own data)
      if (!isAgent) {
        this.loadAgents();
      }
    }

    this.loadLeads();
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

  loadAgents() {
    this.teamService.getAgents().subscribe({
      next: (agents) => {
        this.agents = agents;
      },
      error: (err) => {
        console.error('Failed to load agents', err);
      }
    });
  }

  onOrganizationChange() {
    this.currentPage = 1; // Reset to first page
    this.loadLeads();
  }




  loadLeads(page: number = this.currentPage): void {
    this.isLoading = true;
    // For super_admin: use selectedOrganizationId (null = all organizations)
    // For regular admins: use their organizationId automatically
    const orgId = this.isSuperAdmin
      ? this.selectedOrganizationId
      : this.userOrganizationId;

    this.callAnalysisService.getLeads(page, this.pageSize, orgId).subscribe({
      next: (response: PaginatedLeads) => {
        this.leads = response.leads;
        this.totalItems = response.total;
        this.totalPages = response.totalPages;
        this.currentPage = response.page;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading leads', err);
        this.isLoading = false;
      }
    });
  }



  // Pagination Logic
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadLeads();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLeads();
    }
  }

  goToPage(page: number): void {
    if (page !== this.currentPage) {
      this.currentPage = page;
      this.loadLeads();
    }
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }


  // Upload Modal Logic
  openUploadModal(lead?: Lead): void {
    this.isUploadModalOpen = true;
    this.selectedFiles = [];
    this.fileAgents = [];
    this.uploadProgress = { current: 0, total: 0 };
    this.uploadMetadata = {
      customerName: lead?.customerName || '',
      customerNameAr: (lead as any)?.customerNameAr || '',
      customerNumber: lead?.customerPhone || '',
      leadId: lead?.id
    };
    document.body.style.overflow = 'hidden';
  }

  closeUploadModal(): void {
    if (this.isUploading) return;
    this.isUploadModalOpen = false;
    this.selectedFiles = [];
    this.fileAgents = [];
    this.uploadErrors = [];
    document.body.style.overflow = 'auto';
  }

  cancelUpload(): void {
    this.cancelRequested = true;
    // isUploading will be set to false by processBatch when it detects the flag
    // Close the modal immediately for a responsive feel
    this.isUploading = false;
    this.isUploadModalOpen = false;
    this.selectedFiles = [];
    this.fileAgents = [];
    this.uploadErrors = [];
    document.body.style.overflow = 'auto';
  }


  addFiles(files: File[]): void {
    // Basic validation
    const validFiles = files.filter(file => {
      const isAudio = file.type.startsWith('audio/') ||
        file.name.endsWith('.mp3') ||
        file.name.endsWith('.wav') ||
        file.name.endsWith('.m4a');
      const isUnderLimit = file.size <= 25 * 1024 * 1024;
      return isAudio && isUnderLimit;
    });

    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    // Initialize agent selection as null for new files
    this.fileAgents = [...this.fileAgents, ...new Array(validFiles.length).fill(null)];
  }


  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.fileAgents.splice(index, 1);
  }

  onAgentChange(event: { index: number; agentId: number | null }): void {
    this.fileAgents[event.index] = event.agentId;
  }

  // Upload Modal Logic
  openLeadDetails(lead: Lead): void {
    this.selectedLead = lead;
    this.isLeadDetailsModalOpen = true;
    this.isLoading = true;
    this.callAnalysisService.getLeadById(lead.id).subscribe({
      next: (data: Lead) => {
        if (this.selectedLead) {
          this.selectedLead.calls = data.calls;
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading lead history', err);
        this.isLoading = false;
      }
    });
    document.body.style.overflow = 'hidden';
  }

  closeLeadDetails(): void {
    this.isLeadDetailsModalOpen = false;
    this.selectedLead = null;
    document.body.style.overflow = 'auto';
  }

  startUpload(): void {
    if (this.selectedFiles.length === 0 || !this.uploadMetadata.customerName || this.isUploading) return;

    this.isUploading = true;
    this.cancelRequested = false;
    this.uploadErrors = [];
    this.uploadProgress = { current: 0, total: this.selectedFiles.length };
    this.processBatch(0);
  }

  private processBatch(index: number): void {
    if (this.cancelRequested || index >= this.selectedFiles.length) {
      this.isUploading = false;
      if (!this.cancelRequested) {
        // Always close the modal when batch finishes (success or partial errors)
        this.isUploadModalOpen = false;
        this.selectedFiles = [];
        this.fileAgents = [];
        this.uploadErrors = [];
        document.body.style.overflow = 'auto';
      }
      this.loadLeads();
      if (this.isLeadDetailsModalOpen && this.selectedLead) {
        this.openLeadDetails(this.selectedLead);
      }
      return;
    }

    const file = this.selectedFiles[index];
    this.uploadProgress.current = index + 1;

    // Find agent name from agentId for this specific file
    const fileAgentId = this.fileAgents[index];
    const selectedAgent = fileAgentId
      ? this.agents.find(a => a.id === fileAgentId)
      : null;
    const agentName = selectedAgent ? (selectedAgent.name || selectedAgent.email) : undefined;

    // For super_admin: use selectedOrganizationId
    // For regular admins: use their organizationId automatically
    const orgId = this.isSuperAdmin
      ? this.selectedOrganizationId
      : this.userOrganizationId;

    this.callAnalysisService.uploadRecording(
      file,
      {
        customerName: this.uploadMetadata.customerName,
        customerNameAr: this.uploadMetadata.customerNameAr,
        customerNumber: this.uploadMetadata.customerNumber,
        agentName,
        leadId: this.uploadMetadata.leadId,
        organizationId: orgId
      }
    ).subscribe({
      next: (result: any) => {
        console.log(`Analyzed file ${index + 1}/${this.selectedFiles.length}`);
        this.processBatch(index + 1);
      },
      error: (err: any) => {
        console.error(`Error analyzing file ${index + 1}:`, err);

        // Specific handling for 429 Quota issues
        if (err.status === 429) {
          const quotaMsg = err.error?.details || 'AI Quota Exceeded (Free Tier). Please wait a moment.';
          this.uploadErrors.push(`${file.name}: ${quotaMsg}`);

          // Stop batch processing if quota is hit to avoid multiple errors
          this.isUploading = false;
          this.isUploadModalOpen = false;
          this.selectedFiles = [];
          this.fileAgents = [];
          this.uploadErrors = [];
          document.body.style.overflow = 'auto';
          this.loadLeads();
          return;
        }

        this.uploadErrors.push(`Failed: ${file.name}`);
        this.processBatch(index + 1);
      }
    });
  }





  getAvgScore(): string {
    const callsWithScore = this.selectedLead?.calls?.filter(c => c.analysis?.score != null) || [];
    if (callsWithScore.length === 0) return '0';
    const total = callsWithScore.reduce((acc, c) => acc + (c.analysis?.score || 0), 0);
    return (total / callsWithScore.length).toFixed(1);
  }

  getComplianceScore(): string {
    if (!this.selectedLead?.calls) return '0';
    let totalChecks = 0;
    let passedChecks = 0;

    this.selectedLead.calls.forEach(call => {
      if (call.analysis?.qaResults) {
        // Deduplicate by parameter name before counting to avoid inflated scores
        const seen = new Set<string>();
        call.analysis.qaResults.forEach(item => {
          const key = (item.parameter ?? '').toLowerCase().trim();
          if (!key || seen.has(key)) return;
          seen.add(key);
          if (item.status === 'PASS' || item.status === 'FAIL') {
            totalChecks++;
            if (item.status === 'PASS') passedChecks++;
          }
        });
      }
    });

    if (totalChecks === 0) return '100'; // Default if no checks found
    return ((passedChecks / totalChecks) * 100).toFixed(0);
  }

  downloadPdf(call: Call): void {
    // Opening a protected URL in a new tab won't include Authorization headers.
    // We pass the JWT via query param so the backend can authenticate the PDF request.
    const token = this.authService.getToken();
    const url = this.callAnalysisService.getPdfUrl(
      call.id,
      token || undefined,
      this.translationService.getCurrentLanguage()
    );
    window.open(url, '_blank');
  }

  // View Details Modal Logic
  openCallDetails(call: Call): void {
    this.selectedCall = call;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  openTranscriptModal(language: 'en' | 'ar'): void {
    this.transcriptLanguage = language;
    this.isTranscriptModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedCall = null;
    document.body.style.overflow = 'auto';
  }

}
