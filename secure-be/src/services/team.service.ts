import { db } from '../index';
import bcrypt from 'bcryptjs';

export const getAllTeams = async (organizationId?: number | null) => {
    const where: any = {};
    
    // If organizationId is provided (not null/undefined), filter by it
    // Super Admin (organizationId = null) can see all teams
    if (organizationId !== null && organizationId !== undefined) {
        where.organizationId = organizationId;
    }
    
    return await db.team.findMany({
        where,
        include: {
            _count: {
                select: { users: true }
            }
        }
    });
};

export const getTeamById = async (id: number) => {
    return await db.team.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            users: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    createdAt: true
                }
            }
        }
    });
};

export const createTeam = async (name: string, organizationId?: number | null) => {
    const data: any = { name };
    
    // If organizationId is provided, associate team with organization
    if (organizationId !== null && organizationId !== undefined) {
        data.organizationId = organizationId;
    }
    
    return await db.team.create({
        data
    });
};

export const updateTeam = async (id: number, name: string) => {
    return await db.team.update({
        where: { id },
        data: { name }
    });
};

export const deleteTeam = async (id: number) => {
    // Note: Teams might have users, consider handling cascade or restricted delete
    return await db.team.delete({
        where: { id }
    });
};

export const createAgentInTeam = async (teamId: number, data: { email: string, password: string, name: string, roleId?: number, organizationId?: number | null }) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // If no roleId provided, find Agent role (system role with organizationId = null)
    let roleId = data.roleId;
    if (!roleId) {
        const agentRole = await db.role.findFirst({
            where: { 
                name: 'Agent',
                organizationId: null // System role
            }
        });
        roleId = agentRole?.id;
    }

    const userData: any = {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            roleId: roleId || null,
            teamId: teamId
    };
    
    // If organizationId is provided, associate user with organization
    if (data.organizationId !== null && data.organizationId !== undefined) {
        userData.organizationId = data.organizationId;
    }

    return await db.user.create({
        data: userData,
        include: {
            role: true
        }
    });
};

export const getAllAgents = async (organizationId?: number | null) => {
    // Get Agent role ID (system role with organizationId = null)
    const agentRole = await db.role.findFirst({
        where: { 
            name: 'Agent',
            organizationId: null // System role
        }
    });

    const where: any = {
        roleId: agentRole?.id || undefined
    };
    
    // If organizationId is provided (not null/undefined), filter by it
    // Super Admin (organizationId = null) can see all agents
    if (organizationId !== null && organizationId !== undefined) {
        where.organizationId = organizationId;
    }

    return await db.user.findMany({
        where,
        include: {
            role: true,
            team: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

