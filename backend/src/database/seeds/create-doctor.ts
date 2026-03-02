import 'reflect-metadata';
import AppDataSource from '../data-source';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function run() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const email = 'doctor@example.com';
  const plainPassword = 'DoctorPass123!';

  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    console.log('User already exists:', email);
    console.log('You can login with the same credentials.');
    await AppDataSource.destroy();
    process.exit(0);
  }

  const hashed = await bcrypt.hash(plainPassword, 10);

  const user = new User({
    userId: 'DOC-000001',
    email,
    firstName: 'Seed',
    lastName: 'Doctor',
    password: hashed,
    roles: [UserRole.DOCTOR] as any,
    status: UserStatus.ACTIVE,
    emailVerified: true,
  });

  await userRepo.save(user);
  console.log('Created doctor user:');
  console.log('  email:', email);
  console.log('  password:', plainPassword);

  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
