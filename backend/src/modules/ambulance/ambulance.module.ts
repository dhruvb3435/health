import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { Ambulance, AmbulanceTrip } from './entities/ambulance.entity';
import { AmbulanceService } from './ambulance.service';
import { AmbulanceController } from './ambulance.controller';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Ambulance, AmbulanceTrip]),
  ],
  controllers: [AmbulanceController],
  providers: [AmbulanceService],
  exports: [AmbulanceService],
})
export class AmbulanceModule {}
