import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { BloodInventory, BloodRequest } from './entities/blood-bank.entity';
import { BloodBankService } from './blood-bank.service';
import { BloodBankController } from './blood-bank.controller';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([BloodInventory, BloodRequest]),
  ],
  controllers: [BloodBankController],
  providers: [BloodBankService],
  exports: [BloodBankService],
})
export class BloodBankModule {}
