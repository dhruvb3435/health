import 'reflect-metadata';
import AppDataSource from '../data-source';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

export async function seedUsers(count: number = 150) {
    const userRepo = AppDataSource.getRepository(User);
    const users: User[] = [];

    console.log(`Seeding ${count} users...`);

    const hashedDefault = await bcrypt.hash('DoctorPass123!', 10);

    // Always ensure we have some specific roles for testing
    const roles = [
        UserRole.ADMIN,
        UserRole.DOCTOR,
        UserRole.DOCTOR,
        UserRole.NURSE,
        UserRole.RECEPTIONIST,
        UserRole.PHARMACIST,
        UserRole.LAB_TECHNICIAN,
        UserRole.PATIENT,
        UserRole.PATIENT,
        UserRole.PATIENT,
        UserRole.PATIENT,
        UserRole.PATIENT,
    ];

    // Specific user for the USER
    const dhruvEmail = 'dhruvbagadiya@gmail.com';
    const dhruvUserId = 'DOC-000001';
    const dhruvStableId = '00000000-0000-4000-a000-000000000001';
    const hashedDhruv = await bcrypt.hash('Dhruv@6606', 10);

    let dhruvUser = await userRepo.findOne({
        where: [
            { id: dhruvStableId },
            { email: dhruvEmail },
            { userId: dhruvUserId }
        ]
    });

    if (dhruvUser) {
        // Update existing user to match desired state
        dhruvUser.email = dhruvEmail;
        dhruvUser.userId = dhruvUserId;
        dhruvUser.password = hashedDhruv;
        dhruvUser.status = UserStatus.ACTIVE;
        dhruvUser.roles = [UserRole.ADMIN, UserRole.DOCTOR] as any;
        await userRepo.save(dhruvUser);
        console.log(`Updated specific admin user: ${dhruvEmail}`);
    } else {
        dhruvUser = new User({
            id: dhruvStableId,
            userId: dhruvUserId,
            email: dhruvEmail,
            firstName: 'Dhruv',
            lastName: 'Bagdiya',
            password: hashedDhruv,
            roles: [UserRole.ADMIN, UserRole.DOCTOR] as any,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            phoneNumber: '+91 9876543210',
            address: 'Rajkot, Gujarat',
            city: 'Rajkot',
            state: 'Gujarat',
            postalCode: '360001',
            country: 'India',
            gender: 'male',
            dateOfBirth: new Date('1995-01-01'),
        });
        await userRepo.save(dhruvUser);
        console.log(`Created specific admin user: ${dhruvEmail}`);
    }

    for (let i = 0; i < count; i++) {
        const role = i < roles.length ? [roles[i]] : [faker.helpers.arrayElement(roles)];
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();
        const userId = `${role[0].substring(0, 3).toUpperCase()}-${faker.string.numeric(6)}`;

        // Check if email or userId already exists
        const existing = await userRepo.findOne({
            where: [{ email }, { userId }],
        });
        if (existing) continue;

        const user = new User({
            userId,
            email,
            firstName,
            lastName,
            password: hashedDefault,
            roles: role as any,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            phoneNumber: faker.phone.number(),
            address: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            postalCode: faker.location.zipCode(),
            country: 'India',
            gender: faker.helpers.arrayElement(['male', 'female', 'other']) as
                | 'male'
                | 'female'
                | 'other',
            dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        });

        users.push(user);
        if (users.length >= 20) {
            await userRepo.save(users);
            users.length = 0;
        }
    }

    if (users.length > 0) {
        await userRepo.save(users);
    }

    console.log('User seeding completed.');
}
