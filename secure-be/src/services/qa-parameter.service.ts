import { db } from '../index';

export type CreateQAParameterInput = {
    name: string;
    nameAr?: string;
    description: string;
    passCriteria: string;
    industry?: string;
    weight?: number;
    organizationId?: number;
};

/**
 * Get all global QA parameters (optionally filtered by industry and organization)
 * For super_admin (organizationId = null): Shows all parameters across all organizations
 * For regular admin: Shows only:
 *   - Global parameters (organizationId = null) for their industry
 *   - Their organization's parameters (organizationId = user's organizationId)
 */
export const getAllGlobalParameters = async (industry?: string, organizationId?: number | null) => {
    let where: any = {};

    if (organizationId !== null && organizationId !== undefined) {
        // Regular admin: Show their org params + global params for their industry
        // If industry filter is set, apply it to both
        if (industry && industry !== 'All' && industry !== '') {
            where = {
                isActive: true,
                industry: industry,
                OR: [
                    { organizationId: organizationId }, // Org-specific params for this industry
                    { organizationId: null }              // Global params for this industry
                ]
            };
        } else {
            // No industry filter: Show all org params + all global params
            where = {
                isActive: true,
                OR: [
                    { organizationId: organizationId }, // All org-specific params
                    { organizationId: null }            // All global params
                ]
            };
        }
    } else {
        // Super admin: Show all parameters, optionally filtered by industry
        where = { isActive: true };
        if (industry && industry !== 'All' && industry !== '') {
            where.industry = industry;
        }
    }

    const result = await db.globalQAParameter.findMany({
        where,
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    industry: true
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    console.log('getAllGlobalParameters - industry:', industry, 'organizationId:', organizationId);
    console.log('Query where:', JSON.stringify(where, null, 2));
    console.log('Result count:', result.length);
    if (result.length > 0) {
        console.log('Sample results:', result.slice(0, 3).map(r => ({ id: r.id, name: r.name, industry: r.industry, orgId: r.organizationId })));
    }
    
    return result;
};

/**
 * Get parameter by ID
 */
export const getGlobalParameterById = async (id: number) => {
    return db.globalQAParameter.findUnique({
        where: { id }
    });
};

/**
 * Create new global (or private) parameter
 * If organizationId is provided, automatically uses organization's industry
 */
export const createGlobalParameter = async (data: CreateQAParameterInput, organizationId?: number | null) => {
    let industry = data.industry || 'General';
    
    // If organizationId is provided, get industry from organization
    if (organizationId && !data.industry) {
        const org = await db.organization.findUnique({
            where: { id: organizationId },
            select: { industry: true }
        });
        if (org) {
            industry = org.industry;
        }
    }
    
    return db.globalQAParameter.create({
        data: {
            name: data.name,
            nameAr: data.nameAr || null,
            description: data.description,
            passCriteria: data.passCriteria,
            industry: industry,
            weight: data.weight || 1,
            organizationId: data.organizationId || organizationId || null
        }
    });
};

/**
 * Update global parameter
 * Preserves existing industry if not provided in update data
 */
export const updateGlobalParameter = async (id: number, data: Partial<CreateQAParameterInput>, organizationId?: number | null) => {
    const updateData: any = { ...data };
    
    // If industry is not provided and organizationId exists, use organization's industry
    if (!updateData.industry && organizationId) {
        const org = await db.organization.findUnique({
            where: { id: organizationId },
            select: { industry: true }
        });
        if (org) {
            updateData.industry = org.industry;
        }
    }
    
    // Remove industry from update if it's not explicitly provided (preserve existing)
    if (!data.industry) {
        delete updateData.industry;
    }
    
    return db.globalQAParameter.update({
        where: { id },
        data: updateData
    });
};

/**
 * Delete (soft delete) global parameter
 */
export const deleteGlobalParameter = async (id: number) => {
    return db.globalQAParameter.update({
        where: { id },
        data: { isActive: false }
    });
};
