import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { MedicalRecord } from '../entities/medical-record.entity';
import { TenantService } from '../../../common/services/tenant.service';

@Injectable()
export class MedicalRecordRepository extends BaseRepository<MedicalRecord> {
    constructor(
        private dataSource: DataSource,
        tenantService: TenantService,
    ) {
        super(MedicalRecord, dataSource.createEntityManager(), tenantService);
    }
}
