import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { Admission } from '../admissions/entities/admission.entity';
import { Staff } from '../staff/entities/staff.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Ward } from '../wards/entities/ward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Patient, Doctor, Appointment, Invoice, Admission, Staff, Inventory, Ward])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
