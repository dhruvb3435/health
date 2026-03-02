import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { User } from '../users/entities/user.entity';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientRepository } from './repositories/patient.repository';
import { MedicalRecordRepository } from './repositories/medical-record.repository';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Patient, MedicalRecord, User]), SubscriptionsModule],
  controllers: [PatientsController],
  providers: [PatientsService, PatientRepository, MedicalRecordRepository],
  exports: [PatientsService],
})
export class PatientsModule { }
