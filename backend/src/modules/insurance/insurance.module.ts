import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { InsuranceProvider, InsuranceClaim } from './entities/insurance.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([InsuranceProvider, InsuranceClaim, Invoice]),
  ],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
