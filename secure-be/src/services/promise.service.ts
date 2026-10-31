import { db } from '../index';
import logger from '../utils/logger';

export type PromiseStatus = 'PENDING' | 'FULFILLED' | 'BROKEN';

export const getAllPromises = async (filters: any = {}) => {
    const { status, teamId, userId, startDate, endDate, organizationId, categoryId } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = Number.parseInt(userId);
    if (categoryId) where.categoryId = Number.parseInt(categoryId);
    
    // Build user filter object
    const userFilter: any = {};
    if (teamId) {
        userFilter.teamId = Number.parseInt(teamId);
    }
    if (organizationId) {
        userFilter.organizationId = Number.parseInt(organizationId);
    }
    
    // Only add user filter if there are any user-related filters
    if (Object.keys(userFilter).length > 0) {
        where.user = userFilter;
    }

    if (startDate && endDate) {
        where.createdAt = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    return await db.promise.findMany({
        where,
        include: {
            user: {
                select: { id: true, name: true, team: true, organizationId: true }
            },
            category: true
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const getPromiseCategories = async () => {
    return db.category.findMany({
        orderBy: { name: 'asc' }
    });
};

export const ensureCategory = async (categoryId?: number | null) => {
    if (categoryId) {
        const existing = await db.category.findUnique({ where: { id: categoryId } });
        if (existing) return existing;
    }

    // Default category
    const name = 'General';
    const existingGeneral = await db.category.findFirst({ where: { name } });
    if (existingGeneral) return existingGeneral;
    return db.category.create({ data: { name } });
};

export const createCategory = async (name: string) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
        throw new Error('Category name is required');
    }
    const existing = await db.category.findFirst({ where: { name: trimmed } });
    if (existing) return existing;
    return db.category.create({ data: { name: trimmed } });
};

export const createPromise = async (data: {
    title: string;
    description?: string | null;
    status?: PromiseStatus;
    dueDate: string | Date;
    userId: number;
    categoryId?: number | null;
}) => {
    const { title, description, status, dueDate, userId, categoryId } = data;
    const category = await ensureCategory(categoryId ?? null);

    const promise = await db.promise.create({
        data: {
            title,
            description,
            status: status || 'PENDING',
            dueDate: new Date(dueDate),
            userId,
            categoryId: category.id
        }
    });

    logger.info('Promise created', { promiseId: promise.id, userId });
    return promise;
};

export const updatePromiseStatus = async (id: number, status: string) => {
    const promise = await db.promise.update({
        where: { id },
        data: { status }
    });

    logger.info('Promise status updated', { promiseId: id, status });
    return promise;
};

export const updatePromise = async (
    id: number,
    updates: {
        title?: string;
        description?: string | null;
        status?: PromiseStatus;
        dueDate?: string | Date;
        userId?: number;
        categoryId?: number | null;
    }
) => {
    const data: any = { ...updates };
    if (updates.dueDate) {
        data.dueDate = new Date(updates.dueDate);
    }
    if (updates.categoryId !== undefined) {
        const category = await ensureCategory(updates.categoryId ?? null);
        data.categoryId = category.id;
    }
    const promise = await db.promise.update({ where: { id }, data });
    logger.info('Promise updated', { promiseId: id });
    return promise;
};

export const deletePromise = async (id: number) => {
    const promise = await db.promise.delete({ where: { id } });
    logger.info('Promise deleted', { promiseId: id });
    return promise;
};

export const getPromiseStats = async (organizationId?: number | null, userId?: number) => {
    const where: any = {};
    
    // Filter by userId if provided (for agents)
    if (userId) {
        where.userId = userId;
    } else if (organizationId !== null && organizationId !== undefined) {
        // Filter by organizationId if provided (for admins)
        where.user = {
            organizationId: organizationId
        };
    }
    
    const promises = await db.promise.findMany({
        where,
        include: { user: { include: { team: true } } }
    });

    const total = promises.length;
    const fulfilled = promises.filter(p => p.status === 'FULFILLED').length;
    const broken = promises.filter(p => p.status === 'BROKEN').length;
    const pending = promises.filter(p => p.status === 'PENDING').length;

    // Fulfillment Rate
    const fulfillmentRate = total > 0 ? ((fulfilled / total) * 100).toFixed(1) : '0.0';

    // Agent Performance Stats
    const agentStats = new Map<number, any>();

    promises.forEach(p => {
        const userId = p.userId;
        if (!agentStats.has(userId)) {
            agentStats.set(userId, {
                id: userId,
                name: p.user.name,
                team: p.user.team?.name || 'No Team',
                fulfilled: 0,
                missed: 0,
                total: 0
            });
        }

        const stats = agentStats.get(userId);
        stats.total++;
        if (p.status === 'FULFILLED') stats.fulfilled++;
        if (p.status === 'BROKEN') stats.missed++;
    });

    const agentPerformance = Array.from(agentStats.values()).map(a => ({
        ...a,
        score: a.total > 0 ? Math.round((a.fulfilled / a.total) * 100) : 0,
        stats: `${a.fulfilled} fulfilled, ${a.missed} missed`
    })).sort((a, b) => b.score - a.score);

    return {
        total,
        fulfilled,
        broken,
        pending,
        fulfillmentRate,
        agentPerformance
    };
};
