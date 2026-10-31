import { db } from '../index';
import { initializePermissions } from '../services/permission.service';
import { seedDefaultRoles } from '../services/role.service';
import { seedDefaultTemplates } from '../services/qa-template.service';
import { seedComplianceRules } from './seed-compliance-rules';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
    try {
        // 1. Initialize Permissions
        await initializePermissions();

        // 2. Seed Roles
        await seedDefaultRoles();

        // 3. Seed QA Templates
        await seedDefaultTemplates();

        // 4. Seed Compliance Rules
        await seedComplianceRules();

        // 5. Create Default Super Admin User
        const superAdminEmail = 'superadmin@securosense.com';
        const defaultPassword = 'password123';

        const superAdminRole = await db.role.findFirst({
            where: { 
                name: 'super_admin',
                organizationId: null // System role
            }
        });

        if (superAdminRole) {
            const existingSuperAdmin = await db.user.findUnique({
                where: { email: superAdminEmail }
            });

            if (!existingSuperAdmin) {
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                await db.user.create({
                    data: {
                        name: 'Platform Super Admin',
                        email: superAdminEmail,
                        password: hashedPassword,
                        roleId: superAdminRole.id
                    }
                });
                console.log(`✅ Default Super Admin created: ${superAdminEmail} / ${defaultPassword}`);
            }
        }
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Export for use in other modules
export { seedDatabase };

// Execute seeding
if (require.main === module) {
    seedDatabase();
}
