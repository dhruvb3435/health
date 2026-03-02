import { Injectable } from '@nestjs/common';
import { DataSource, Between } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Appointment } from '../entities/appointment.entity';
import { TenantService } from '../../../common/services/tenant.service';

@Injectable()
export class AppointmentRepository extends BaseRepository<Appointment> {
    constructor(
        private dataSource: DataSource,
        tenantService: TenantService,
    ) {
        super(Appointment, dataSource.createEntityManager(), tenantService);
    }

    /**
     * Custom method to find appointment with full details and tenant isolation
     */
    async findById(id: string): Promise<Appointment | null> {
        return this.createTenantQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'patientUser')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .leftJoinAndSelect('doctor.user', 'doctorUser')
            .where('appointment.id = :id', { id })
            .getOne();
    }

    /**
     * Count appointments for a doctor on a specific date for the current tenant
     */
    async countForDoctorOnDate(doctorId: string, date: Date): Promise<number> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.count({
            where: {
                doctorId,
                organizationId: this.tenantService.getTenantId(),
                appointmentDate: Between(startOfDay, endOfDay),
            },
        });
    }
}
