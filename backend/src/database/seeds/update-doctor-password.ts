import 'reflect-metadata';
import AppDataSource from '../data-source';
import { User, UserStatus } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function run() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  // Find any existing doctor user
  const doctor = await userRepo
    .createQueryBuilder('user')
    .where(`user.roles && :role`, { role: '{doctor}' })
    .getOne();

  if (!doctor) {
    console.error('No existing doctor user found. Create one first.');
    await AppDataSource.destroy();
    process.exit(1);
  }

  const plainPassword = 'DoctorPass123!';
  const hashed = await bcrypt.hash(plainPassword, 10);

  doctor.password = hashed;
  doctor.status = UserStatus.ACTIVE;
  doctor.emailVerified = true;

  await userRepo.save(doctor);

  console.log('Updated doctor credentials:');
  console.log('  email:', doctor.email);
  console.log('  password:', plainPassword);
  console.log('  userId:', doctor.userId);

  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
