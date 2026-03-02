import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './services/s3.service';
import { AuditService } from './services/audit.service';
import { TenantService } from './services/tenant.service';
import { AuditLog } from './entities/audit-log.entity';

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AuditLog])],
  providers: [S3Service, AuditService, TenantService],
  exports: [S3Service, AuditService, TenantService],
})
export class CommonModule { }
