import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

// Entity imports
import { User } from '../modules/users/entities/user.entity';
import { Patient } from '../modules/patients/entities/patient.entity';
import { Doctor } from '../modules/doctors/entities/doctor.entity';
import { Appointment } from '../modules/appointments/entities/appointment.entity';
import { Prescription } from '../modules/prescriptions/entities/prescription.entity';
import { MedicalRecord } from '../modules/patients/entities/medical-record.entity';
import { Invoice } from '../modules/billing/entities/invoice.entity';
import { LabTest } from '../modules/laboratory/entities/lab-test.entity';
import { Medicine } from '../modules/pharmacy/entities/medicine.entity';
import { AuditLog } from '../common/entities/audit-log.entity';
import { Staff } from '../modules/staff/entities/staff.entity';
import { Inventory } from '../modules/inventory/entities/inventory.entity';
import { Ward, Bed } from '../modules/wards/entities/ward.entity';
import { Admission } from '../modules/admissions/entities/admission.entity';
import { OperationTheater, Surgery } from '../modules/operation-theater/entities/operation-theater.entity';
import { RadiologyRequest } from '../modules/radiology/entities/radiology.entity';
import { Expense, Revenue } from '../modules/accounts/entities/accounts.entity';
import { ComplianceRecord, DataAccessLog } from '../modules/compliance/entities/compliance.entity';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { Role } from '../modules/rbac/entities/role.entity';
import { Permission } from '../modules/rbac/entities/permission.entity';

const sanitize = (val: any): any => {
  if (typeof val !== 'string') return val;
  return val.replace(/^["']|["']$/g, '').trim();
};

import { Plan } from '../modules/subscriptions/entities/plan.entity';
import { Subscription } from '../modules/subscriptions/entities/subscription.entity';
import { FeatureLimit } from '../modules/subscriptions/entities/feature-limit.entity';
import { OrganizationUsage } from '../modules/subscriptions/entities/organization-usage.entity';
import { Payment } from '../modules/billing/entities/payment.entity';
import { EmailVerificationToken } from '../modules/auth/entities/email-verification-token.entity';

const ENTITIES = [
  User, Patient, Doctor, Appointment, Prescription, MedicalRecord,
  Invoice, LabTest, Medicine, AuditLog, Staff, Inventory,
  Ward, Bed, Admission, OperationTheater, Surgery, RadiologyRequest,
  Expense, Revenue, ComplianceRecord, DataAccessLog,
  Organization, Role, Permission,
  Plan, Subscription, FeatureLimit, OrganizationUsage, Payment,
  EmailVerificationToken,
];

export const typeormConfig = (configService: ConfigService): DataSourceOptions => {
  const getVal = (key: string, fallback?: any) => {
    const val = configService.get(key) || process.env[key] || fallback;
    return sanitize(val);
  };

  const env = getVal('NODE_ENV', 'development');
  const databaseUrl = getVal('DATABASE_URL');

  console.log(`🔍 Checking configuration: NODE_ENV=${env}, has DATABASE_URL=${!!databaseUrl}`);

  const commonOptions: Partial<DataSourceOptions> = {
    entities: ENTITIES,
    migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false, // We use migrations now to handle data preservation
    logging: env === 'development',
  };

  let config: DataSourceOptions;

  if (databaseUrl) {
    console.log(`🔌 Configuring TypeORM with DATABASE_URL`);
    const useSsl =
      env === 'production' ||
      databaseUrl.includes('neon.tech') ||
      databaseUrl.includes('supabase');

    config = {
      type: 'postgres',
      url: databaseUrl,
      ...commonOptions,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    } as DataSourceOptions;
  } else {
    const host = getVal('DATABASE_HOST', getVal('PGHOST', 'localhost'));
    const port = Number(getVal('DATABASE_PORT', getVal('PGPORT', 5432)));
    const username = getVal('DATABASE_USER', getVal('PGUSER'));
    const password = getVal('DATABASE_PASSWORD', getVal('PGPASSWORD'));
    const database = getVal('DATABASE_NAME', getVal('PGDATABASE'));

    console.log(`🔌 Configuring TypeORM with parameters: host=${host}, port=${port}, user=${username}, db=${database}`);

    const useSsl =
      env === 'production' ||
      host.includes('neon.tech') ||
      host.includes('supabase');

    if (useSsl) {
      console.log('🔒 SSL enabled for database connection (rejectUnauthorized: false)');
    } else if (host === 'localhost' || host === '127.0.0.1') {
      console.warn('⚠️  Connecting to localhost. This may fail on Railway if you intended to use an external DB.');
    }

    config = {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      ...commonOptions,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    } as DataSourceOptions;
  }

  return config;
};

// For TypeORM CLI
const env = sanitize(process.env.NODE_ENV);
const databaseUrl = sanitize(process.env.DATABASE_URL);
const host = sanitize(process.env.DATABASE_HOST || process.env.PGHOST || 'localhost');
const useSsl =
  env === 'production' ||
  (databaseUrl && (databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase'))) ||
  (host && (host.includes('neon.tech') || host.includes('supabase')));

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  host: !databaseUrl ? host : undefined,
  port: !databaseUrl ? Number(sanitize(process.env.DATABASE_PORT || process.env.PGPORT || '5432')) : undefined,
  username: !databaseUrl ? sanitize(process.env.DATABASE_USER || process.env.PGUSER) : undefined,
  password: !databaseUrl ? sanitize(process.env.DATABASE_PASSWORD || process.env.PGPASSWORD) : undefined,
  database: !databaseUrl ? sanitize(process.env.DATABASE_NAME || process.env.PGDATABASE) : undefined,
  entities: ENTITIES,
  migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false, // For CLI always false to avoid side effects during migration generation
  logging: env === 'development',
  ssl: useSsl ? { rejectUnauthorized: false } : false,
} as DataSourceOptions);
