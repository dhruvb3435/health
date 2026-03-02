import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './guards/throttler.guard';
import { DataSource } from 'typeorm';
import { typeormConfig } from './database/typeorm.config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PatientsModule } from './modules/patients/patients.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { BillingModule } from './modules/billing/billing.module';
import { LaboratoryModule } from './modules/laboratory/laboratory.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { StaffModule } from './modules/staff/staff.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WardsModule } from './modules/wards/wards.module';
import { OperationTheaterModule } from './modules/operation-theater/operation-theater.module';
import { RadiologyModule } from './modules/radiology/radiology.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
// Phase 6: Product Polish & Growth Engine
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MailModule } from './modules/mail/mail.module';

import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { TenantGuard } from './guards/tenant.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => typeormConfig(configService),
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    PrescriptionsModule,
    BillingModule,
    LaboratoryModule,
    PharmacyModule,
    DashboardModule,
    StaffModule,
    InventoryModule,
    WardsModule,
    OperationTheaterModule,
    RadiologyModule,
    AccountsModule,
    ComplianceModule,
    AdmissionsModule,
    RbacModule,
    SubscriptionsModule,
    // Phase 6
    OnboardingModule,
    NotificationsModule,
    MailModule,
    // Rate Limiting — named throttlers allow per-route overrides via @Throttle({ name: ... })
    ThrottlerModule.forRoot([
      {
        name: 'global',   // Default: 100 requests per minute per IP
        ttl: 60_000,
        limit: 100,
      },
      {
        name: 'auth-strict', // Used by auth endpoints via @Throttle({ 'auth-strict': { ... } })
        ttl: 60_000,
        limit: 5,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,  // Swagger-bypass + proxy-aware IP
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) { }

  onModuleInit() {
    const options = this.dataSource.options as any;
    console.log(`📡 Database connected successfully to: ${options.host || options.url || 'unknown host'}`);
  }
}
