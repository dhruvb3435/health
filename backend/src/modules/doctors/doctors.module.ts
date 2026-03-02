import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './entities/doctor.entity';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { User } from '../users/entities/user.entity';
import { DoctorRepository } from './repositories/doctor.repository';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, User]), SubscriptionsModule],
  controllers: [DoctorsController],
  providers: [DoctorsService, DoctorRepository],
})
export class DoctorsModule { }
