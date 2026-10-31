import { Component, OnInit } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule, TranslatePipe],
  template: `
    <div class="flex h-screen bg-[#0f172a] overflow-hidden main-layout-container"
         [class.flex-row-reverse]="translationService.isRTL()"
         [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      <!-- Sidebar -->
      <app-sidebar *ngIf="!shouldHideSidebar" [isOpen]="isSidebarOpen" (sidebarClose)="isSidebarOpen = false"></app-sidebar>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-hidden relative w-full">
        <!-- Mobile Header -->
        <header class="lg:hidden h-16 bg-[#1e293b] border-b border-[#334155] flex items-center justify-between px-4 shrink-0"
                [class.flex-row-reverse]="translationService.isRTL()">
            <button (click)="isSidebarOpen = true" 
                    class="text-white p-2"
                    [class.-ml-2]="!translationService.isRTL()"
                    [class.-mr-2]="translationService.isRTL()">
                <span class="sr-only">{{ 'common.openSidebar' | translate }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 class="text-white font-medium">SecuroSense</h2>
            <div class="w-8"></div> <!-- Spacer for centering -->
        </header>

        <!-- Content Area -->
        <div class="flex-1 overflow-auto p-0 scroll-smooth">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: []
})
export class MainLayoutComponent implements OnInit {
  isSidebarOpen = false;
  shouldHideSidebar = false;

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly authService: AuthService,
    public readonly translationService: TranslationService
  ) {
    // Check sidebar visibility first
    this.checkShouldHideSidebar();
    
    // Set sidebar open on desktop (only if not hidden)
    if (globalThis.window !== undefined) {
      if (!this.shouldHideSidebar && globalThis.window.innerWidth >= 1024) {
        this.isSidebarOpen = true;
      }
      
      // Listen for window resize
      globalThis.window.addEventListener('resize', () => {
        this.checkShouldHideSidebar();
        if (!this.shouldHideSidebar && globalThis.window.innerWidth >= 1024) {
          this.isSidebarOpen = true;
        } else if (this.shouldHideSidebar) {
          this.isSidebarOpen = false;
        }
      });
    }
    
    // Check on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkShouldHideSidebar();
      if (this.shouldHideSidebar || (globalThis.window !== undefined && globalThis.window.innerWidth < 1024)) {
        this.isSidebarOpen = false;
      }
    });
  }

  ngOnInit() {
    // Re-check on init to ensure correct state
    this.checkShouldHideSidebar();
  }

  checkShouldHideSidebar() {
    const user = this.authService.getUser();
    const normalizedRole = this.authService.getNormalizedRole();
    const isSuperAdmin = normalizedRole === 'super_admin' || !user?.organizationId;
    const currentUrl = this.router.url;
    
    // Hide sidebar for super_admin on business-profile page
    this.shouldHideSidebar = isSuperAdmin && (currentUrl.includes('/settings/business-profile') || currentUrl === '/settings/business-profile');
    
    // If sidebar should be hidden, ensure it's closed
    if (this.shouldHideSidebar) {
      this.isSidebarOpen = false;
    }
  }
}
