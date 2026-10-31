import { db } from '../index';
import { generateToken, generateRefreshToken } from '../middlewares/auth.middleware';
import bcrypt from 'bcryptjs';

export const registerUser = async (email: string, password: string, name?: string, nameAr?: string, language?: string) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default registration role is now Admin (system role with organizationId = null)
    const adminRole = await db.role.findFirst({
        where: { 
            name: 'Admin',
            organizationId: null // System role
        }
    });

    // Validate language
    const validLanguages = ['en', 'ar', 'fr'];
    const userLanguage = language && validLanguages.includes(language) ? language : 'en';

    const user = await db.user.create({
        data: {
            email,
            password: hashedPassword,
            name: name || null,
            nameAr: nameAr || null,
            language: userLanguage,
            roleId: adminRole?.id || null
        },
        include: {
            role: true
        }
    });

    const roleName = user.role?.name || 'Admin';
    const accessToken = generateToken(user.id, roleName, user.organizationId);
    const refreshToken = generateRefreshToken(user.id, roleName, user.organizationId);
    return { user, accessToken, refreshToken };
};

export const loginUser = async (email: string, password: string) => {
    const user = await db.user.findUnique({
        where: { email },
        include: {
            role: true
        }
    });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const roleName = user.role?.name || 'Agent';
    const accessToken = generateToken(user.id, roleName, user.organizationId);
    const refreshToken = generateRefreshToken(user.id, roleName, user.organizationId);
    return { user, accessToken, refreshToken };
};
