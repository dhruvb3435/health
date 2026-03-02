import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Invoice } from '../entities/invoice.entity';
import { TenantService } from '../../../common/services/tenant.service';

@Injectable()
export class InvoiceRepository extends BaseRepository<Invoice> {
    constructor(
        private dataSource: DataSource,
        tenantService: TenantService,
    ) {
        super(Invoice, dataSource.createEntityManager(), tenantService);
    }

    /**
     * Custom method to find invoice with full details and tenant isolation
     */
    async findById(id: string): Promise<Invoice | null> {
        return this.createTenantQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'user')
            .where('invoice.id = :id', { id })
            .getOne();
    }
}
