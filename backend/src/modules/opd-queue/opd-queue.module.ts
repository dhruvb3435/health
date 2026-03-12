import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { OpdQueueController } from './opd-queue.controller';
import { OpdQueueService } from './opd-queue.service';
import { OpdQueue } from './entities/opd-queue.entity';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([OpdQueue])],
  controllers: [OpdQueueController],
  providers: [OpdQueueService],
  exports: [OpdQueueService],
})
export class OpdQueueModule {}
