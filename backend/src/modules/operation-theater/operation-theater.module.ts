import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { OperationTheaterController } from './operation-theater.controller';
import { OperationTheaterService } from './operation-theater.service';
import { OperationTheater, Surgery } from './entities/operation-theater.entity';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([OperationTheater, Surgery])],
  controllers: [OperationTheaterController],
  providers: [OperationTheaterService],
  exports: [OperationTheaterService],
})
export class OperationTheaterModule {}
