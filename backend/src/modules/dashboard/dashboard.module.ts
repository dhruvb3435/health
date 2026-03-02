import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Invoice } from '../billing/entities/invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Patient, Doctor, Appointment, Invoice])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
