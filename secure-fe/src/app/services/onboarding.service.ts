import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs'; // Fix: Import Observable
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

export interface SetupOrgInput {
    organizationName: string;
    organizationNameAr?: string;
    industry: string;
    industryAr?: string;
    size?: string;
    sizeAr?: string;
    email?: string;
    phone?: string;
    website?: string;
    country?: string;
    countryAr?: string;
    city?: string;
    cityAr?: string;
    state?: string;
    stateAr?: string;
    address?: string;
    addressAr?: string;
    postalCode?: string;
    description?: string;
    descriptionAr?: string;
    teams: string[];
}

@Injectable({
    providedIn: 'root'
})
export class OnboardingService {
    constructor(
        private api: ApiService,
        private authService: AuthService
    ) { }

    setup(data: SetupOrgInput): Observable<any> {
        return this.api.post('onboarding/setup', data).pipe(
            tap((response: any) => {
                if (response.tokens) {
                    let user = this.authService.getUser();
                    if (user && response.organization) {
                        user = { ...user, organizationId: response.organization.id };
                    }

                    this.authService.setSession({
                        accessToken: response.tokens.accessToken,
                        refreshToken: response.tokens.refreshToken,
                        user: user
                    });
                }
            })
        );
    }
}
