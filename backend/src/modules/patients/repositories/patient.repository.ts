import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Patient } from '../entities/patient.entity';
import { TenantService } from '../../../common/services/tenant.service';

@Injectable()
export class PatientRepository extends BaseRepository<Patient> {
    constructor(
        private dataSource: DataSource,
        tenantService: TenantService,
    ) {
        super(Patient, dataSource.createEntityManager(), tenantService);
    }

    /**
     * Custom method to find patient with full details and tenant isolation
     */
    async findById(id: string): Promise<Patient | null> {
        return this.createTenantQueryBuilder('patient')
            .leftJoinAndSelect('patient.user', 'user')
            .leftJoinAndSelect('patient.medicalRecords', 'medicalRecords')
            .leftJoinAndSelect('patient.appointments', 'appointments')
            .leftJoinAndSelect('patient.prescriptions', 'prescriptions')
            .andWhere('patient.id = :id', { id })
            .getOne();
    }
}
