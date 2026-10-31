import { db } from '../index';
import { Prisma } from '@prisma/client';

interface DashboardStats {
    totalRevenue: number;
    dealsClosed: number;
    avgDealValue: number;
    growthPercentage: number;
}

interface TeamPerformance {
    teamName: string;
    revenue: number;
    dealsClosed: number;
    agentCount: number;
}

function buildCallFilter(organizationId?: number | null, startDate?: Date, endDate?: Date): Prisma.CallWhereInput | undefined {
    const callWhere: Prisma.CallWhereInput = {};

    if (organizationId !== null && organizationId !== undefined) {
        callWhere.organizationId = organizationId;
    }

    if (startDate || endDate) {
        callWhere.timestamp = {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {})
        };
    }

    return Object.keys(callWhere).length > 0 ? callWhere : undefined;
}

async function getRevenueAgg(where: Prisma.CallAnalysisWhereInput) {
    const agg = await db.callAnalysis.aggregate({
        where,
        _sum: { dealValue: true },
        _count: { id: true }
    });

    return {
        totalRevenue: Number(agg._sum.dealValue) || 0,
        dealsClosed: agg._count.id || 0
    };
}

async function getUserNamesByIds(userIds: number[]) {
    if (userIds.length === 0) return [];
    const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { name: true }
    });
    return users.map(u => u.name).filter((n): n is string => !!n);
}

function buildCallBaseFilter(organizationId?: number | null, startDate?: Date, endDate?: Date): Prisma.CallWhereInput {
    return {
        ...(organizationId !== null && organizationId !== undefined ? { organizationId } : {}),
        ...(startDate || endDate
            ? {
                timestamp: {
                    ...(startDate ? { gte: startDate } : {}),
                    ...(endDate ? { lte: endDate } : {})
                }
            }
            : {})
    };
}

function buildTeamCallWhere(
    organizationId: number | null | undefined,
    startDate: Date | undefined,
    endDate: Date | undefined,
    userIds: number[],
    agentNames: string[]
): Prisma.CallWhereInput {
    const callBase = buildCallBaseFilter(organizationId, startDate, endDate);
    const orParts: Prisma.CallWhereInput[] = [];
    if (userIds.length > 0) orParts.push({ agentId: { in: userIds } });
    if (agentNames.length > 0) orParts.push({ agentName: { in: agentNames } });

    return orParts.length > 0 ? { ...callBase, OR: orParts } : callBase;
}

/**
 * Get aggregated dashboard statistics (Revenue, Deals, Growth)
 */
export const getDashboardStats = async (
    organizationId?: number | null,
    startDate?: Date,
    endDate?: Date
): Promise<DashboardStats> => {
    const callFilter = buildCallFilter(organizationId, startDate, endDate);
    const where: Prisma.CallAnalysisWhereInput = {
        wasDealClosed: true,
        ...(callFilter ? { call: callFilter } : {})
    };

    const current = await getRevenueAgg(where);
    const totalRevenue = current.totalRevenue;
    const dealsClosed = current.dealsClosed;
    const avgDealValue = dealsClosed > 0 ? totalRevenue / dealsClosed : 0;

    // Growth %: compare current range vs previous range (same duration)
    let growthPercentage = 0;
    if (startDate && endDate) {
        const durationMs = Math.max(0, endDate.getTime() - startDate.getTime());
        const prevEnd = new Date(startDate);
        const prevStart = new Date(startDate.getTime() - durationMs);

        const prevCallFilter = buildCallFilter(organizationId, prevStart, prevEnd);
        const prevWhere: Prisma.CallAnalysisWhereInput = {
            wasDealClosed: true,
            ...(prevCallFilter ? { call: prevCallFilter } : {})
        };

        const prev = await getRevenueAgg(prevWhere);
        if (prev.totalRevenue > 0) {
            growthPercentage = ((totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100;
        } else if (totalRevenue > 0) {
            growthPercentage = 100;
        }
    }

    return {
        totalRevenue: Math.round(totalRevenue),
        dealsClosed,
        avgDealValue: Math.round(avgDealValue),
        growthPercentage: Math.round(growthPercentage * 10) / 10
    };
};

/**
 * Get revenue breakdown by Team
 */
export const getTeamPerformance = async (
    organizationId?: number | null,
    startDate?: Date,
    endDate?: Date
): Promise<TeamPerformance[]> => {
    // 1. Get teams filtered by organization
    const teamWhere: Prisma.TeamWhereInput = {};
    if (organizationId !== null && organizationId !== undefined) {
        teamWhere.organizationId = organizationId;
    }

    const teams = await db.team.findMany({
        where: teamWhere,
        include: {
            users: {
                select: { id: true }
            }
        }
    });

    const results: TeamPerformance[] = [];

    for (const team of teams) {
        const userIds = team.users.map(u => u.id);
        const agentCount = team.users.length;

        if (userIds.length === 0) {
            results.push({ teamName: team.name, revenue: 0, dealsClosed: 0, agentCount: 0 });
            continue;
        }

        const teamAgentNames = await getUserNamesByIds(userIds);
        const callWhere = buildTeamCallWhere(organizationId, startDate, endDate, userIds, teamAgentNames);

        const where: Prisma.CallAnalysisWhereInput = {
            wasDealClosed: true,
            call: callWhere
        };

        const stats = await db.callAnalysis.aggregate({
            where,
            _sum: { dealValue: true },
            _count: { id: true }
        });

        results.push({
            teamName: team.name,
            revenue: Number(stats._sum.dealValue) || 0,
            dealsClosed: stats._count.id || 0,
            agentCount
        });
    }

    return results.sort((a, b) => b.revenue - a.revenue);
};

/**
 * Get revenue distribution by source (Call Type)
 */
export const getRevenueDistribution = async (
    organizationId?: number | null,
    startDate?: Date,
    endDate?: Date
) => {
    const callFilter = buildCallFilter(organizationId, startDate, endDate);
    const where: Prisma.CallAnalysisWhereInput = {
        wasDealClosed: true,
        ...(callFilter ? { call: callFilter } : {})
    };

    const distribution = await db.callAnalysis.groupBy({
        by: ['callType'],
        where: where,
        _sum: {
            dealValue: true
        }
    });

    const totalRevenue = distribution.reduce((sum, d) => sum + (Number(d._sum.dealValue) || 0), 0);

    return distribution.map(d => ({
        source: d.callType || 'Other',
        revenue: Number(d._sum.dealValue) || 0,
        percentage: totalRevenue > 0 ? Math.round(((Number(d._sum.dealValue) || 0) / totalRevenue) * 100) : 0
    })).sort((a, b) => b.revenue - a.revenue);
};
