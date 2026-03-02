import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Doctor } from '../entities/doctor.entity';
import { TenantService } from '../../../common/services/tenant.service';

@Injectable()
export class DoctorRepository extends BaseRepository<Doctor> {
    constructor(
        private dataSource: DataSource,
        tenantService: TenantService,
    ) {
        super(Doctor, dataSource.createEntityManager(), tenantService);
    }

    /**
     * Custom method to find doctor with full details and tenant isolation
     */
    async findById(id: string): Promise<Doctor | null> {
        return this.createTenantQueryBuilder('doctor')
            .leftJoinAndSelect('doctor.user', 'user')
            .leftJoinAndSelect('doctor.appointments', 'appointments')
            .leftJoinAndSelect('doctor.prescriptions', 'prescriptions')
            .where('doctor.id = :id', { id })
            .getOne();
    }
}
