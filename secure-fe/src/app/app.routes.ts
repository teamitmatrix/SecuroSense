import { Routes } from '@angular/router';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout';
import { SalesDashboardComponent } from './components/dashboard/sales-dashboard/sales-dashboard';
import { LoginComponent } from './components/auth/login';
import { RegisterComponent } from './components/auth/register';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    // Public routes (no auth required)
    { path: 'welcome', loadComponent: () => import('./components/landing/landing-page/landing-page').then(m => m.LandingPageComponent) },
    { path: 'features', loadComponent: () => import('./components/landing/features-page/features-page').then(m => m.FeaturesPageComponent) },
    { path: 'performance', loadComponent: () => import('./components/landing/performance-page/performance-page').then(m => m.PerformancePageComponent) },
    { path: 'industries', loadComponent: () => import('./components/landing/industries-page/industries-page').then(m => m.IndustriesPageComponent) },
    { path: 'contact', loadComponent: () => import('./components/landing/contact-page/contact-page').then(m => m.ContactPageComponent) },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    // Protected routes
    { path: 'onboarding', loadComponent: () => import('./components/onboarding/onboarding-wizard/onboarding-wizard').then(m => m.OnboardingWizardComponent), canActivate: [authGuard] },

    // Dashboard Routes (With Sidebar) - Protected
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'sales', component: SalesDashboardComponent },
            { path: 'call-analysis', loadComponent: () => import('./components/dashboard/call-analysis/call-analysis').then(m => m.CallAnalysisComponent) },
            { path: 'promise-management', loadComponent: () => import('./components/dashboard/promise-management/promise-management').then(m => m.PromiseManagementComponent) },
            { path: 'settings/teams', loadComponent: () => import('./components/management/team-management').then(m => m.TeamManagementComponent) },
            { path: 'settings/agents', loadComponent: () => import('./components/management/agent-management').then(m => m.AgentManagementComponent) },
            { path: 'settings/benchmarking', loadComponent: () => import('./components/management/agent-benchmarking').then(m => m.AgentBenchmarkingComponent) },
            { path: 'settings/roles', loadComponent: () => import('./components/management/role-management').then(m => m.RoleManagementComponent) },
            { path: 'settings/qa-templates', loadComponent: () => import('./components/management/qa-template-management').then(m => m.QaTemplateManagementComponent) },
            { path: 'settings/qa-parameters', loadComponent: () => import('./components/management/qa-parameter-management/qa-parameter-management').then(m => m.QaParameterManagementComponent) },
            { path: 'settings/organizations', loadComponent: () => import('./components/management/organization-management').then(m => m.OrganizationManagementComponent) },
            { path: 'settings/business-profile', loadComponent: () => import('./components/settings/business-profile/business-profile').then(m => m.BusinessProfileComponent) },
            { path: 'compliance', loadComponent: () => import('./components/dashboard/compliance-dashboard/compliance-dashboard').then(m => m.ComplianceDashboardComponent) },

            { path: '', redirectTo: 'call-analysis', pathMatch: 'full' }
        ]
    },

    // Default redirect - if not logged in, go to welcome; if logged in, auth guard will handle
    { path: '**', redirectTo: '/welcome', pathMatch: 'full' }
];
