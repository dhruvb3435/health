import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabTest } from './entities/lab-test.entity';
import { LaboratoryService } from './laboratory.service';
import { LaboratoryController } from './laboratory.controller';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([LabTest])],
  controllers: [LaboratoryController],
  providers: [LaboratoryService],
  exports: [LaboratoryService],
})
export class LaboratoryModule { }
