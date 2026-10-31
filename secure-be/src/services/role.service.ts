import { db } from '../index';
import { PERMISSIONS, PermissionName } from './permission.service';
import logger from '../utils/logger';

export interface CreateRoleInput {
    name: string;
    description?: string;
    permissions: PermissionName[];
    organizationId?: number | null;
}

/**
 * Create a new role with permissions
 */
export const createRole = async (input: CreateRoleInput) => {
    // Get permission IDs
    const permissions = await db.permission.findMany({
        where: {
            name: { in: input.permissions }
        }
    });

    const role = await db.role.create({
        data: {
            name: input.name,
            description: input.description || null,
            organizationId: input.organizationId || null,
            permissions: {
                create: permissions.map(p => ({
                    permissionId: p.id
                }))
            }
        },
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });

    logger.info('Role created', { roleId: role.id, name: role.name, organizationId: role.organizationId, permissionCount: permissions.length });
    return role;
};

/**
 * Get all roles with their permissions
 * Filters by organization: regular users see their org's roles + system roles (except super_admin), super_admin sees all
 */
export const getAllRoles = async (organizationId?: number | null, userRole?: string) => {
    const where: any = {};
    
    // Check if user is super_admin
    const isSuperAdmin = (organizationId === null || organizationId === undefined) ||
                        userRole === 'super_admin' || 
                        userRole?.toLowerCase() === 'super admin';
    
    if (isSuperAdmin) {
        // Super Admin can see ALL roles (system + all organizations)
        // No filter needed
    } else {
        // Regular admins see:
        // 1. System roles (organizationId = null, isSystem = true) EXCEPT super_admin
        // 2. Their own organization's roles (organizationId = their org id)
        where.OR = [
            { 
                organizationId: organizationId 
            }, // Organization-specific roles
            { 
                organizationId: null, 
                isSystem: true,
                name: { not: 'super_admin' } // Exclude super_admin role
            } // System roles (available to all) except super_admin
        ];
    }
    
    return await db.role.findMany({
        where,
        select: {
            id: true,
            name: true,
            description: true,
            isSystem: true,
            organizationId: true,
            organization: {
                select: {
                    id: true,
                    name: true
                }
            },
            createdAt: true,
            updatedAt: true,
            permissions: {
                include: {
                    permission: true
                }
            },
            _count: {
                select: {
                    users: true
                }
            }
        },
        orderBy: [
            { organizationId: 'asc' }, // System roles first (null), then org roles
            { name: 'asc' }
        ]
    });
};

/**
 * Get role by ID with permissions
 */
export const getRoleById = async (id: number) => {
    return await db.role.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
            isSystem: true,
            organizationId: true,
            organization: {
                select: {
                    id: true,
                    name: true
                }
            },
            createdAt: true,
            updatedAt: true,
            permissions: {
                include: {
                    permission: true
                }
            },
            users: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });
};

/**
 * Update role and its permissions
 */
export const updateRole = async (id: number, updates: Partial<CreateRoleInput>) => {
    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;

    // If permissions are being updated
    if (updates.permissions) {
        // Delete existing permissions
        await db.rolePermission.deleteMany({
            where: { roleId: id }
        });

        // Get new permission IDs
        const permissions = await db.permission.findMany({
            where: {
                name: { in: updates.permissions }
            }
        });

        updateData.permissions = {
            create: permissions.map(p => ({
                permissionId: p.id
            }))
        };
    }

    const role = await db.role.update({
        where: { id },
        data: updateData,
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });

    logger.info('Role updated', { roleId: id, name: role.name });
    return role;
};

/**
 * Delete role (only if not system role)
 */
export const deleteRole = async (id: number) => {
    const role = await db.role.findUnique({
        where: { id }
    });

    if (!role) {
        throw new Error('Role not found');
    }

    if (role.isSystem) {
        throw new Error('Cannot delete system roles');
    }

    // Check if role is assigned to any users
    const userCount = await db.user.count({
        where: { roleId: id }
    });

    if (userCount > 0) {
        throw new Error(`Cannot delete role. It is assigned to ${userCount} user(s)`);
    }

    await db.role.delete({
        where: { id }
    });

    logger.info('Role deleted', { roleId: id, name: role.name });
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = async (roleId: number): Promise<PermissionName[]> => {
    const role = await db.role.findUnique({
        where: { id: roleId },
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });

    if (!role) return [];

    return role.permissions.map(rp => rp.permission.name as PermissionName);
};

/**
 * Check if role has specific permission
 */
export const roleHasPermission = async (roleId: number, permissionName: PermissionName): Promise<boolean> => {
    const count = await db.rolePermission.count({
        where: {
            roleId,
            permission: {
                name: permissionName
            }
        }
    });

    return count > 0;
};

/**
 * Seed default system roles
 */
export const seedDefaultRoles = async () => {
    const roles = [
        {
            name: 'super_admin',
            description: 'Platform owner with full system access',
            isSystem: true,
            permissions: Object.values(PERMISSIONS)
        },
        {
            name: 'Admin',
            description: 'Organization Administrator',
            isSystem: true,
            permissions: [
                PERMISSIONS.VIEW_CALLS,
                PERMISSIONS.ANALYZE_CALLS,
                PERMISSIONS.DELETE_CALLS,
                PERMISSIONS.DOWNLOAD_REPORTS,
                PERMISSIONS.VIEW_TEAMS,
                PERMISSIONS.MANAGE_TEAMS,
                PERMISSIONS.VIEW_USERS,
                PERMISSIONS.MANAGE_USERS,
                PERMISSIONS.ASSIGN_PERMISSIONS,
                PERMISSIONS.VIEW_QA_TEMPLATES,
                PERMISSIONS.MANAGE_QA_TEMPLATES,
                PERMISSIONS.MANAGE_SETTINGS,
                PERMISSIONS.VIEW_AUDIT_LOGS,
                PERMISSIONS.VIEW_ANALYTICS,
                PERMISSIONS.EXPORT_DATA
            ]
        },
        {
            name: 'QA Manager',
            description: 'Manage QA templates, view analytics, and manage teams',
            isSystem: true,
            permissions: [
                PERMISSIONS.VIEW_CALLS,
                PERMISSIONS.ANALYZE_CALLS,
                PERMISSIONS.DOWNLOAD_REPORTS,
                PERMISSIONS.VIEW_TEAMS,
                PERMISSIONS.MANAGE_TEAMS,
                PERMISSIONS.VIEW_QA_TEMPLATES,
                PERMISSIONS.MANAGE_QA_TEMPLATES,
                PERMISSIONS.VIEW_ANALYTICS,
                PERMISSIONS.EXPORT_DATA
            ]
        },
        {
            name: 'Agent',
            description: 'Standard agent with basic call analysis permissions',
            isSystem: true,
            permissions: [
                PERMISSIONS.VIEW_CALLS,
                PERMISSIONS.ANALYZE_CALLS,
                PERMISSIONS.DOWNLOAD_REPORTS,
                PERMISSIONS.VIEW_TEAMS
            ]
        },
        {
            name: 'Team Lead',
            description: 'Manage team and view analytics',
            isSystem: true,
            permissions: [
                PERMISSIONS.VIEW_CALLS,
                PERMISSIONS.ANALYZE_CALLS,
                PERMISSIONS.DOWNLOAD_REPORTS,
                PERMISSIONS.VIEW_TEAMS,
                PERMISSIONS.MANAGE_TEAMS,
                PERMISSIONS.VIEW_ANALYTICS,
                PERMISSIONS.EXPORT_DATA
            ]
        },
        {
            name: 'Viewer',
            description: 'Read-only access to calls and analytics',
            isSystem: true,
            permissions: [
                PERMISSIONS.VIEW_CALLS,
                PERMISSIONS.VIEW_TEAMS,
                PERMISSIONS.VIEW_ANALYTICS
            ]
        }
    ];

    for (const roleData of roles) {
        try {
            // Check if role exists (system roles have organizationId = null)
            const existing = await db.role.findFirst({
                where: { 
                    name: roleData.name,
                    organizationId: null // System roles are global
                }
            });

            // Get permission IDs
            const permissions = await db.permission.findMany({
                where: {
                    name: { in: roleData.permissions }
                }
            });

            if (existing) {
                // Role exists - update permissions to ensure they're current
                // Delete existing permissions
                await db.rolePermission.deleteMany({
                    where: { roleId: existing.id }
                });

                // Add new permissions
                await db.rolePermission.createMany({
                    data: permissions.map(p => ({
                        roleId: existing.id,
                        permissionId: p.id
                    }))
                });

                logger.info('Updated role permissions', { name: roleData.name, permissionCount: permissions.length });
            } else {
                // Create new role
                await db.role.create({
                    data: {
                        name: roleData.name,
                        description: roleData.description,
                        isSystem: roleData.isSystem,
                        organizationId: null, // System roles are global (no organization)
                        permissions: {
                            create: permissions.map(p => ({
                                permissionId: p.id
                            }))
                        }
                    }
                });

                logger.info('Seeded role', { name: roleData.name, permissionCount: permissions.length });
            }
        } catch (error) {
            logger.error('Failed to seed role', { name: roleData.name, error });
        }
    }

    logger.info('Role seeding complete');
};
