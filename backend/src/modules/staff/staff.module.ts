import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { Staff } from './entities/staff.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Staff, User])],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule { }
