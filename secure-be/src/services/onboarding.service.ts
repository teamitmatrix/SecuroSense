import { db } from '../index';

interface SetupOrgInput {
    userId: number;
    organizationName: string;
    industry: string;
    size?: string;
    email?: string;
    phone?: string;
    website?: string;
    country?: string;
    city?: string;
    state?: string;
    address?: string;
    postalCode?: string;
    description?: string;
    teams: string[]; // List of initial team names
    regulatoryFramework?: string[]; // ["MiFID_II", "MiFID_III", etc.]
    complianceOfficerEmail?: string;
    mifidEnabled?: boolean;
}

/**
 * Setup a new Organization for a user.
 * 1. Create Organization
 * 2. Link User to Org
 * 3. Create initial Teams
 * 4. Seed default QA Templates for this Org (optional, or link to global)
 */
export const setupOrganization = async (input: SetupOrgInput) => {
    return db.$transaction(async (tx) => {
        // Determine if MiFID should be enabled based on industry
        const financialIndustries = ['Banking', 'Finance', 'Insurance', 'Wealth Management', 'Investment'];
        const shouldEnableMiFID = financialIndustries.includes(input.industry) || input.mifidEnabled === true;
        const regulatoryFramework = input.regulatoryFramework || (shouldEnableMiFID ? ['MiFID_II', 'MiFID_III'] : []);

        // 1. Create Organization
        const org = await tx.organization.create({
            data: {
                name: input.organizationName,
                industry: input.industry,
                size: input.size,
                email: input.email,
                phone: input.phone,
                website: input.website,
                country: input.country,
                city: input.city,
                state: input.state,
                address: input.address,
                postalCode: input.postalCode,
                description: input.description,
                regulatoryFramework: regulatoryFramework,
                complianceOfficerEmail: input.complianceOfficerEmail || null,
                mifidEnabled: shouldEnableMiFID
            }
        });

        // 2. Update User (Assign to Org and ensure Admin role if not already)
        // Check if user is already Admin, if not maybe upgrade them? 
        // For now, assume the registrar is the Admin.
        await tx.user.update({
            where: { id: input.userId },
            data: { organizationId: org.id }
        });

        // 3. Create Teams
        if (input.teams && input.teams.length > 0) {
            await tx.team.createMany({
                data: input.teams.map(name => ({
                    name,
                    organizationId: org.id
                }))
            });
        }

        // 4. Create default QA Templates for this Org based on Industry?
        // For MVP, we might clone Global Parameters or just leave empty.
        // Let's create one default template for them.
        await tx.qATemplate.create({
            data: {
                name: `${input.industry} Standard Standards`,
                industry: input.industry,
                description: `Default QA standards for ${input.organizationName}`,
                organizationId: org.id,
                parameters: [
                    { name: 'Greeting', description: 'Standard greeting', passCriteria: 'Say Hello', weight: 1 },
                    { name: 'Closing', description: 'Standard closing', passCriteria: 'Say Goodbye', weight: 1 }
                ]
            }
        });

        return org;
    });
};
