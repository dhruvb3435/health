import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../modules/users/entities/user.entity';
import { Organization, OrganizationStatus } from '../../modules/organizations/entities/organization.entity';
import { Role } from '../../modules/rbac/entities/role.entity';
import { Permission } from '../../modules/rbac/entities/permission.entity';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function seedDemoOrg() {
    const { AppDataSource } = await import('../typeorm.config');

    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log('\n🚀 Initializing SaaS Demo Organization...\n');

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const roleRepo = AppDataSource.getRepository(Role);
        const permRepo = AppDataSource.getRepository(Permission);

        // 1. Create Demo Organization
        let demoOrg = await orgRepo.findOne({ where: { slug: 'premium-care' } });
        if (!demoOrg) {
            demoOrg = await orgRepo.save(orgRepo.create({
                name: 'Premium Care Hospital',
                slug: 'premium-care',
                status: OrganizationStatus.ACTIVE,
                logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=200&h=200',
            }));
            console.log('✅ Created Organization: Premium Care Hospital');
        }

        // 2. Setup standard permissions
        const permissions = [
            { name: 'users:read', category: 'Users' },
            { name: 'users:manage', category: 'Users' },
            { name: 'patients:read', category: 'Patients' },
            { name: 'patients:manage', category: 'Patients' },
            { name: 'doctors:read', category: 'Doctors' },
            { name: 'doctors:manage', category: 'Doctors' },
            { name: 'billing:manage', category: 'Billing' },
            { name: 'analytics:read', category: 'Analytics' },
        ];

        for (const p of permissions) {
            let perm = await permRepo.findOne({ where: { name: p.name } });
            if (!perm) {
                await permRepo.save(permRepo.create(p));
            }
        }
        const allPerms = await permRepo.find();

        // 3. Create Admin Role for this Org
        let adminRole = await roleRepo.findOne({
            where: { name: 'Admin', organizationId: demoOrg.id }
        });
        if (!adminRole) {
            adminRole = await roleRepo.save(roleRepo.create({
                name: 'Admin',
                organizationId: demoOrg.id,
                isSystemRole: true,
                permissions: allPerms,
            }));
            console.log('✅ Created Admin Role for Demo Org');
        }

        // 4. Create Demo Admin User
        const adminEmail = 'demo@aarogentix.com';
        let demoUser = await userRepo.findOne({ where: { email: adminEmail } });
        if (!demoUser) {
            demoUser = await userRepo.save(userRepo.create({
                userId: 'ADMIN-DEMO-01',
                email: adminEmail,
                password: await bcrypt.hash('Aarogentix@2026', 10),
                firstName: 'Premium',
                lastName: 'Admin',
                organizationId: demoOrg.id,
                status: UserStatus.ACTIVE,
                emailVerified: true,
                roles: [adminRole],
            }));
            console.log('✅ Created Demo Admin User: demo@aarogentix.com');
        }

        console.log('\n✨ SaaS Demo environment ready!');
        console.log('-----------------------------------');
        console.log('Organization: Premium Care Hospital');
        console.log('Admin Email:  demo@aarogentix.com');
        console.log('Password:     Aarogentix@2026');
        console.log('-----------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding demo org:', error);
        process.exit(1);
    }
}

seedDemoOrg();
