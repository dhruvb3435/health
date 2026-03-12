import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { DischargeSummary } from './entities/discharge-summary.entity';
import { DischargeSummaryService } from './discharge-summary.service';
import { DischargeSummaryController } from './discharge-summary.controller';

@Module({
    imports: [CommonModule, TypeOrmModule.forFeature([DischargeSummary])],
    controllers: [DischargeSummaryController],
    providers: [DischargeSummaryService],
    exports: [DischargeSummaryService],
})
export class DischargeSummaryModule {}
