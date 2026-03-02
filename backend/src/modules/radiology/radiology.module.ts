import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RadiologyController } from './radiology.controller';
import { RadiologyService } from './radiology.service';
import { RadiologyRequest } from './entities/radiology.entity';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([RadiologyRequest])],
  controllers: [RadiologyController],
  providers: [RadiologyService],
  exports: [RadiologyService],
})
export class RadiologyModule { }
