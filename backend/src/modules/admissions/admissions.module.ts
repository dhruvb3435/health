import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { Admission } from './entities/admission.entity';
import { Ward, Bed } from '../wards/entities/ward.entity';
import { AdmissionsService } from './admissions.service';
import { AdmissionsController } from './admissions.controller';

@Module({
    imports: [CommonModule, TypeOrmModule.forFeature([Admission, Ward, Bed])],
    controllers: [AdmissionsController],
    providers: [AdmissionsService],
    exports: [AdmissionsService],
})
export class AdmissionsModule { }
