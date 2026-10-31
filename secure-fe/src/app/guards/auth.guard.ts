import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = (route: any, state: any) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
        // Don't redirect to login - let user stay on welcome page or go to login/register
        // Only redirect if they're trying to access protected route
        if (state.url !== '/welcome' && state.url !== '/login' && state.url !== '/register') {
            router.navigate(['/welcome']);
        }
        return false;
    }

    const user = authService.getUser();
    if (!user) {
        router.navigate(['/login']);
        return false;
    }

    const isOnboarding = state.url.includes('/onboarding');
    
    // Get role name - handle both object and string formats
    let roleName = '';
    if (user?.role) {
        if (typeof user.role === 'string') {
            roleName = user.role;
        } else if (typeof user.role === 'object' && 'name' in user.role) {
            roleName = (user.role as any).name || '';
        }
    }
    
    // Check for super_admin role (case-insensitive and handle variations)
    const roleNameLower = roleName?.toLowerCase() || '';
    const isSuperAdmin = roleName === 'super_admin' || 
                        roleNameLower === 'super_admin' ||
                        roleName === 'Super Admin' || // Legacy support
                        roleNameLower === 'super admin' ||
                        roleNameLower === 'superadmin';
    
    // Check if user is an Agent
    const isAgent = roleName === 'Agent' || roleNameLower === 'agent';

    // Super Admin never needs onboarding (they manage the platform)
    // Super Admin should always be redirected away from onboarding
    if (isSuperAdmin) {
        if (isOnboarding) {
            // Redirect Super Admin away from onboarding to dashboard
            router.navigate(['/sales']);
            return false;
        }
        // Super Admin can access all other routes
        return true;
    }

    // For Agents: If user has no organization, they MUST onboard
    // After onboarding, redirect to call-analysis (not sales dashboard)
    if (isAgent) {
        if (!user?.organizationId) {
            if (!isOnboarding) {
                router.navigate(['/onboarding']);
                return false;
            }
            return true;
        } else {
            // Agent with organization should NOT be on onboarding page
            if (isOnboarding) {
                router.navigate(['/call-analysis']);
                return false;
            }
            // Block access to sales dashboard for agents
            if (state.url === '/sales' || state.url === '/') {
                router.navigate(['/call-analysis']);
                return false;
            }
            return true;
        }
    }

    // For non-Super Admin, non-Agent users: If user has no organization, they MUST onboard
    if (!user?.organizationId) {
        if (!isOnboarding) {
            router.navigate(['/onboarding']);
            return false;
        }
        return true;
    } else {
        // If user HAS organization, they should NOT be on onboarding page
        if (isOnboarding) {
            router.navigate(['/sales']);
            return false;
        }
        return true;
    }
};
