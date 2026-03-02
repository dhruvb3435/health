import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingProgress } from './entities/onboarding-progress.entity';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { DemoDataService } from './demo-data.service';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Ward } from '../wards/entities/ward.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            OnboardingProgress,
            Organization,
            User,
            Doctor,
            Patient,
            Appointment,
            Ward,
            Inventory,
        ]),
        MailModule,
    ],
    controllers: [OnboardingController],
    providers: [OnboardingService, DemoDataService],
    exports: [OnboardingService, DemoDataService],
})
export class OnboardingModule { }
