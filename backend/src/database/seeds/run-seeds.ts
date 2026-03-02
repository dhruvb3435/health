import 'reflect-metadata';
import AppDataSource from '../data-source';
import { seedUsers } from './seed-users';
import { seedHealthcareEntities } from './seed-healthcare-entities';

async function run() {
  console.log('Starting database seeding...');

  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized.');

    // 1. Seed Users (150 users)
    await seedUsers(180);

    // 2. Seed Patients, Doctors, Appointments, etc.
    await seedHealthcareEntities();

    console.log('All seeds completed successfully! ✅');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(0);
  }
}

run();
