import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WardsController } from './wards.controller';
import { WardsService } from './wards.service';
import { Ward, Bed } from './entities/ward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ward, Bed])],
  controllers: [WardsController],
  providers: [WardsService],
  exports: [WardsService],
})
export class WardsModule {}
