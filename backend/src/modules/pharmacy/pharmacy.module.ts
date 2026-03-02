import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { Medicine } from './entities/medicine.entity';
import { PharmacyService } from './pharmacy.service';
import { PharmacyController } from './pharmacy.controller';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Medicine])],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule { }
