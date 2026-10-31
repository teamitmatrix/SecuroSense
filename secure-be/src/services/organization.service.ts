// backend/src/services/organization.service.ts
import { db } from '../index';
import { PermissionName, grantPermission, revokePermission } from './permission.service';
import logger from '../utils/logger';
import bcrypt from 'bcryptjs';

/**
 * Get all organizations with their admin user's email
 * Only super_admin can access this
 */
export const getAllOrganizations = async () => {
    const organizations = await db.organization.findMany({
        include: {
            users: {
                include: {
                    role: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    users: true,
                    teams: true,
                    calls: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Format response to include admin email and counts
    return organizations.map(org => {
        // Find admin user (role name = 'Admin' and belongs to this organization)
        const adminUser = org.users.find(u => 
            u.role?.name === 'Admin' && 
            u.organizationId === org.id
        );

        return {
            id: org.id,
            name: org.name,
            industry: org.industry,
            size: org.size,
            adminEmail: adminUser?.email || null,
            adminName: adminUser?.name || null,
            adminId: adminUser?.id || null,
            userCount: org._count.users,
            teamCount: org._count.teams,
            callCount: org._count.calls,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt
        };
    });
};

/**
 * Get organization by ID with admin details
 */
export const getOrganizationById = async (id: number) => {
    const org = await db.organization.findUnique({
        where: { id },
        include: {
            users: {
                include: {
                    role: true
                }
            },
            _count: {
                select: {
                    users: true,
                    teams: true,
                    calls: true
                }
            }
        }
    });

    if (!org) {
        return null;
    }

    return {
        id: org.id,
        name: org.name,
        industry: org.industry,
        size: org.size,
        address: org.address,
        city: org.city,
        state: org.state,
        country: org.country,
        postalCode: org.postalCode,
        phone: org.phone,
        email: org.email,
        website: org.website,
        timezone: org.timezone,
        taxId: org.taxId,
        registrationNumber: org.registrationNumber,
        description: org.description,
        foundedYear: org.foundedYear,
        adminEmail: org.users.find(u => u.role?.name === 'Admin')?.email || null,
        adminName: org.users.find(u => u.role?.name === 'Admin')?.name || null,
        adminId: org.users.find(u => u.role?.name === 'Admin')?.id || null,
        userCount: org._count.users,
        teamCount: org._count.teams,
        callCount: org._count.calls,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt
    };
};

/**
 * Create a new organization (super_admin only)
 */
export interface CreateOrganizationInput {
    name: string;
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
    timezone?: string;
    taxId?: string;
    registrationNumber?: string;
    foundedYear?: number;
    regulatoryFramework?: string[];
    complianceOfficerEmail?: string;
    mifidEnabled?: boolean;
}

export const createOrganization = async (input: CreateOrganizationInput) => {
    // Check if organization with same name already exists
    const existingOrg = await db.organization.findFirst({
        where: { name: input.name }
    });

    if (existingOrg) {
        throw new Error('Organization with this name already exists');
    }

    // Determine if MiFID should be enabled based on industry
    const financialIndustries = ['Banking', 'Finance', 'Insurance', 'Wealth Management', 'Investment'];
    const shouldEnableMiFID = financialIndustries.includes(input.industry) || input.mifidEnabled === true;
    const regulatoryFramework = input.regulatoryFramework || (shouldEnableMiFID ? ['MiFID_II', 'MiFID_III'] : []);

    const org = await db.organization.create({
        data: {
            name: input.name,
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
            timezone: input.timezone || 'UTC',
            taxId: input.taxId,
            registrationNumber: input.registrationNumber,
            foundedYear: input.foundedYear,
            regulatoryFramework: regulatoryFramework,
            complianceOfficerEmail: input.complianceOfficerEmail || null,
            mifidEnabled: shouldEnableMiFID
        }
    });

    logger.info('Organization created', {
        organizationId: org.id,
        name: org.name,
        industry: org.industry
    });

    return org;
};

/**
 * Create admin user for a specific organization
 * Only super_admin can do this
 */
export const createAdminUserForOrganization = async (
    organizationId: number,
    email: string,
    password: string,
    name: string
) => {
    // Check if organization exists
    const org = await db.organization.findUnique({
        where: { id: organizationId }
    });

    if (!org) {
        throw new Error('Organization not found');
    }

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Get Admin role (system role with organizationId = null)
    const adminRole = await db.role.findFirst({
        where: { 
            name: 'Admin',
            organizationId: null // System role
        }
    });

    if (!adminRole) {
        throw new Error('Admin role not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with Admin role and organization
    const user = await db.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            roleId: adminRole.id,
            organizationId: organizationId
        },
        include: {
            role: true,
            organization: true
        }
    });

    logger.info('Admin user created for organization', {
        userId: user.id,
        email,
        organizationId
    });

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role?.name,
        organizationId: user.organizationId,
        organizationName: user.organization?.name
    };
};

/**
 * Update organization admin's permissions
 * Only super_admin can do this
 */
export const updateOrganizationAdminPermissions = async (
    organizationId: number,
    permissions: PermissionName[],
    grantedBy: number
) => {
    // Find the organization
    const org = await db.organization.findUnique({
        where: { id: organizationId },
        include: {
            users: {
                include: {
                    role: true
                }
            }
        }
    });

    if (!org) {
        throw new Error('Organization not found');
    }

    // Find Admin user
    const adminUser = org.users.find(u => u.role?.name === 'Admin');
    if (!adminUser) {
        throw new Error('No Admin user found for this organization');
    }

    // Get current permissions for the admin
    const currentPermissions = await db.userPermission.findMany({
        where: { userId: adminUser.id },
        include: { permission: true }
    });

    const currentPermissionNames = new Set(
        currentPermissions.map(up => up.permission.name as PermissionName)
    );

    const newPermissionNames = new Set(permissions);

    // Revoke permissions that are not in the new list
    for (const currentPerm of currentPermissionNames) {
        if (!newPermissionNames.has(currentPerm)) {
            await revokePermission(adminUser.id, currentPerm);
            logger.info('Permission revoked from organization admin', {
                organizationId,
                userId: adminUser.id,
                permission: currentPerm,
                grantedBy
            });
        }
    }

    // Grant new permissions
    for (const newPerm of newPermissionNames) {
        if (!currentPermissionNames.has(newPerm)) {
            await grantPermission(adminUser.id, newPerm, grantedBy);
            logger.info('Permission granted to organization admin', {
                organizationId,
                userId: adminUser.id,
                permission: newPerm,
                grantedBy
            });
        }
    }

    // Get updated permissions
    const updatedPermissions = await db.userPermission.findMany({
        where: { userId: adminUser.id },
        include: { permission: true }
    });

    return {
        organizationId: org.id,
        organizationName: org.name,
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        permissions: updatedPermissions.map(up => ({
            name: up.permission.name,
            description: up.permission.description,
            category: up.permission.category,
            grantedAt: up.grantedAt
        }))
    };
};

/**
 * Get organization admin's current permissions
 */
export const getOrganizationAdminPermissionsCached = async (organizationId: number) => {
    const org = await db.organization.findUnique({
        where: { id: organizationId },
        include: {
            users: {
                include: {
                    role: true
                }
            }
        }
    });

    if (!org) {
        throw new Error('Organization not found');
    }

    // Find Admin user
    const adminUser = org.users.find(u => u.role?.name === 'Admin');
    if (!adminUser) {
        throw new Error('No Admin user found for this organization');
    }

    const [permissions, rolePermissions, allPerms] = await Promise.all([
        db.userPermission.findMany({
            where: { userId: adminUser.id },
            include: { permission: true }
        }),
        db.rolePermission.findMany({
            where: {
                role: {
                    users: {
                        some: { id: adminUser.id }
                    }
                }
            },
            include: { permission: true }
        }),
        getAllPermissionsCached()
    ]);

    const allPermissionNames = new Set<PermissionName>();
    
    permissions.forEach(up => {
        allPermissionNames.add(up.permission.name as PermissionName);
    });

    rolePermissions.forEach(rp => {
        allPermissionNames.add(rp.permission.name as PermissionName);
    });

    return {
        organizationId: org.id,
        organizationName: org.name,
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        adminName: adminUser.name,
        permissions: Array.from(allPermissionNames).map(permName => {
            const perm = allPerms.find(p => p.name === permName);
            const isDirect = permissions.some(up => up.permission.name === permName);
            return {
                name: permName,
                description: perm?.description || '',
                category: perm?.category || '',
                source: isDirect ? 'direct' : 'role'
            };
        })
    };
};

// Helper to get all permissions
const getAllPermissions = async () => {
    return await db.permission.findMany();
};

let allPermissionsCache: any[] | null = null;

// Cache all permissions
const getAllPermissionsCached = async () => {
    allPermissionsCache ??= await getAllPermissions();
    return allPermissionsCache;
};
