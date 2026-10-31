import { db } from '../index';

// Permission Constants
export const PERMISSIONS = {
    // Call Analysis
    VIEW_CALLS: 'VIEW_CALLS',
    ANALYZE_CALLS: 'ANALYZE_CALLS',
    DELETE_CALLS: 'DELETE_CALLS',
    DOWNLOAD_REPORTS: 'DOWNLOAD_REPORTS',

    // Teams
    VIEW_TEAMS: 'VIEW_TEAMS',
    MANAGE_TEAMS: 'MANAGE_TEAMS',

    // Users
    VIEW_USERS: 'VIEW_USERS',
    MANAGE_USERS: 'MANAGE_USERS',
    ASSIGN_PERMISSIONS: 'ASSIGN_PERMISSIONS',

    // QA Templates
    VIEW_QA_TEMPLATES: 'VIEW_QA_TEMPLATES',
    MANAGE_QA_TEMPLATES: 'MANAGE_QA_TEMPLATES',

    // Settings
    MANAGE_SETTINGS: 'MANAGE_SETTINGS',
    VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',

    // Organization
    MANAGE_ORGANIZATIONS: 'MANAGE_ORGANIZATIONS',

    // Analytics
    VIEW_ANALYTICS: 'VIEW_ANALYTICS',
    EXPORT_DATA: 'EXPORT_DATA',
} as const;

export type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Check if user has a specific permission (from role or direct assignment)
 */
export const hasPermission = async (userId: number, permissionName: PermissionName): Promise<boolean> => {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            },
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });

    if (!user) return false;

    // Check role permissions
    if (user.role) {
        const hasRolePermission = user.role.permissions.some(
            (rp: any) => rp.permission.name === permissionName
        );
        if (hasRolePermission) return true;
    }

    // Check direct permissions
    const hasDirectPermission = user.permissions.some(
        (up: any) => up.permission.name === permissionName
    );

    return hasDirectPermission;
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = async (userId: number, permissionNames: PermissionName[]): Promise<boolean> => {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            },
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });

    if (!user) return false;

    // Check role permissions
    if (user.role) {
        const hasRolePermission = user.role.permissions.some(
            (rp: any) => permissionNames.includes(rp.permission.name as PermissionName)
        );
        if (hasRolePermission) return true;
    }

    // Check direct permissions
    const hasDirectPermission = user.permissions.some(
        (up: any) => permissionNames.includes(up.permission.name as PermissionName)
    );

    return hasDirectPermission;
};

/**
 * Get all permissions for a user (from role + direct assignments)
 */
export const getUserPermissions = async (userId: number): Promise<PermissionName[]> => {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            },
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });

    if (!user) return [];

    const permissionSet = new Set<PermissionName>();

    // Add role permissions
    if (user.role) {
        user.role.permissions.forEach((rp: any) => {
            permissionSet.add(rp.permission.name as PermissionName);
        });
    }

    // Add direct permissions
    user.permissions.forEach((up: any) => {
        permissionSet.add(up.permission.name as PermissionName);
    });

    return Array.from(permissionSet);
};

/**
 * Grant permission to user
 */
export const grantPermission = async (
    userId: number,
    permissionName: PermissionName,
    grantedBy: number
): Promise<void> => {
    const permission = await db.permission.findUnique({
        where: { name: permissionName }
    });

    if (!permission) {
        throw new Error(`Permission ${permissionName} not found`);
    }

    await db.userPermission.upsert({
        where: {
            userId_permissionId: {
                userId,
                permissionId: permission.id
            }
        },
        create: {
            userId,
            permissionId: permission.id,
            grantedBy
        },
        update: {
            grantedBy
        }
    });
};

/**
 * Revoke permission from user
 */
export const revokePermission = async (
    userId: number,
    permissionName: PermissionName
): Promise<void> => {
    const permission = await db.permission.findUnique({
        where: { name: permissionName }
    });

    if (!permission) return;

    await db.userPermission.deleteMany({
        where: {
            userId,
            permissionId: permission.id
        }
    });
};

/**
 * Initialize default permissions in database
 */
export const initializePermissions = async (): Promise<void> => {
    const permissions = [
        { name: PERMISSIONS.VIEW_CALLS, description: 'View call recordings and analysis', category: 'CALLS' },
        { name: PERMISSIONS.ANALYZE_CALLS, description: 'Upload and analyze new calls', category: 'CALLS' },
        { name: PERMISSIONS.DELETE_CALLS, description: 'Delete call recordings', category: 'CALLS' },
        { name: PERMISSIONS.DOWNLOAD_REPORTS, description: 'Download PDF reports', category: 'REPORTS' },
        { name: PERMISSIONS.VIEW_TEAMS, description: 'View team information', category: 'TEAMS' },
        { name: PERMISSIONS.MANAGE_TEAMS, description: 'Create and manage teams', category: 'TEAMS' },
        { name: PERMISSIONS.VIEW_USERS, description: 'View user list', category: 'USERS' },
        { name: PERMISSIONS.MANAGE_USERS, description: 'Create, update, delete users', category: 'USERS' },
        { name: PERMISSIONS.ASSIGN_PERMISSIONS, description: 'Grant and revoke permissions', category: 'USERS' },
        { name: PERMISSIONS.VIEW_QA_TEMPLATES, description: 'View QA templates', category: 'SETTINGS' },
        { name: PERMISSIONS.MANAGE_QA_TEMPLATES, description: 'Create and edit QA templates', category: 'SETTINGS' },
        { name: PERMISSIONS.MANAGE_SETTINGS, description: 'Modify system settings', category: 'SETTINGS' },
        { name: PERMISSIONS.MANAGE_ORGANIZATIONS, description: 'Create and manage organizations', category: 'SETTINGS' },
        { name: PERMISSIONS.VIEW_AUDIT_LOGS, description: 'View audit logs', category: 'SETTINGS' },
        { name: PERMISSIONS.VIEW_ANALYTICS, description: 'View analytics dashboard', category: 'REPORTS' },
        { name: PERMISSIONS.EXPORT_DATA, description: 'Export data (CSV, Excel)', category: 'REPORTS' },
    ];

    for (const perm of permissions) {
        await db.permission.upsert({
            where: { name: perm.name },
            create: perm,
            update: { description: perm.description }
        });
    }
};

/**
 * List all available permissions in the system
 * Filters out MANAGE_ORGANIZATIONS for regular admins (only super_admin can see it)
 */
export const listAllPermissions = async (organizationId?: number | null) => {
    const where: any = {};
    
    // Super Admin (organizationId = null/undefined) can see ALL permissions including MANAGE_ORGANIZATIONS
    // Regular admins (organizationId is a number) cannot see MANAGE_ORGANIZATIONS
    if (organizationId !== null && organizationId !== undefined) {
        where.name = {
            not: 'MANAGE_ORGANIZATIONS' // Hide this permission from regular admins
        };
    }
    // If organizationId is null/undefined (Super Admin), show all permissions (no filter)
    
    return await db.permission.findMany({
        where,
        orderBy: { category: 'asc' }
    });
};
