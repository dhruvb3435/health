import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { ComplianceRecord, DataAccessLog } from './entities/compliance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceRecord, DataAccessLog])],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
