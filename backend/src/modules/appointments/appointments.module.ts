import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentRepository } from './repositories/appointment.repository';
import { MailModule } from '../mail/mail.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Appointment]), MailModule, SubscriptionsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentRepository],
})
export class AppointmentsModule { }
