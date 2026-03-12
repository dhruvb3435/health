import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { Admission } from '../admissions/entities/admission.entity';
import { Staff } from '../staff/entities/staff.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Ward } from '../wards/entities/ward.entity';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepo: Repository<Patient>,
        @InjectRepository(Doctor)
        private readonly doctorRepo: Repository<Doctor>,
        @InjectRepository(Appointment)
        private readonly appointmentRepo: Repository<Appointment>,
        @InjectRepository(Invoice)
        private readonly invoiceRepo: Repository<Invoice>,
        @InjectRepository(Admission)
        private readonly admissionRepo: Repository<Admission>,
        @InjectRepository(Staff)
        private readonly staffRepo: Repository<Staff>,
        @InjectRepository(Inventory)
        private readonly inventoryRepo: Repository<Inventory>,
        @InjectRepository(Ward)
        private readonly wardRepo: Repository<Ward>,
        private readonly tenantService: TenantService,
    ) { }

    async getStats() {
        const organizationId = this.tenantService.getTenantId();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalPatients, totalDoctors, totalAppointments,
            todayAppointments, activeStaff, activeAdmissions,
        ] = await Promise.all([
            this.patientRepo.count({ where: { organizationId } }),
            this.doctorRepo.count({ where: { organizationId } }),
            this.appointmentRepo.count({ where: { organizationId } }),
            this.appointmentRepo.count({ where: { organizationId, appointmentDate: today } }),
            this.staffRepo.count({ where: { organizationId, status: 'active' as any } }),
            this.admissionRepo.count({ where: { organizationId, status: 'admitted' as any } }),
        ]);

        // Real revenue calculation
        const revenueResult = await this.invoiceRepo
            .createQueryBuilder('invoice')
            .where('invoice.organizationId = :organizationId', { organizationId })
            .select('SUM(invoice.totalAmount)', 'total')
            .getRawOne();

        // Ward stats
        const wards = await this.wardRepo.find({ where: { organizationId } });
        const totalBeds = wards.reduce((sum, w) => sum + w.totalBeds, 0);
        const occupiedBeds = wards.reduce((sum, w) => sum + w.occupiedBeds, 0);

        // Low stock count
        const lowStockCount = await this.inventoryRepo
            .createQueryBuilder('item')
            .where('item.organizationId = :organizationId', { organizationId })
            .andWhere('item.quantity <= item.minimumLevel')
            .getCount();

        return {
            totalPatients,
            totalDoctors,
            totalAppointments,
            todayAppointments,
            activeStaff,
            activeAdmissions,
            revenue: parseFloat(revenueResult?.total || '0'),
            totalBeds,
            occupiedBeds,
            availableBeds: totalBeds - occupiedBeds,
            lowStockItems: lowStockCount,
        };
    }

    async getRevenueTrend() {
        const organizationId = this.tenantService.getTenantId();
        const results = await this.invoiceRepo
            .createQueryBuilder('invoice')
            .where('invoice.organizationId = :organizationId', { organizationId })
            .select("to_char(invoice.issueDate, 'Mon')", 'month')
            .addSelect('SUM(invoice.totalAmount)', 'amount')
            .groupBy("to_char(invoice.issueDate, 'Mon')")
            .orderBy("MIN(invoice.issueDate)", "ASC")
            .getRawMany();

        return results.map(r => ({
            month: r.month,
            amount: parseFloat(r.amount)
        }));
    }

    async getPatientVolume() {
        const organizationId = this.tenantService.getTenantId();
        const results = await this.appointmentRepo
            .createQueryBuilder('appointment')
            .where('appointment.organizationId = :organizationId', { organizationId })
            .select("to_char(appointment.appointmentDate, 'Day')", 'day')
            .addSelect('COUNT(appointment.id)', 'count')
            .groupBy("to_char(appointment.appointmentDate, 'Day')")
            .orderBy("MIN(appointment.appointmentDate)", "ASC")
            .getRawMany();

        return results.map(r => ({
            day: r.day.trim(),
            count: parseInt(r.count)
        }));
    }

    async getRecentActivity() {
        const organizationId = this.tenantService.getTenantId();
        const recentAppointments = await this.appointmentRepo.find({
            where: { organizationId },
            relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
            order: { appointmentDate: 'DESC' },
            take: 5,
        });

        return recentAppointments.map((app) => ({
            id: app.id,
            patientName: `${app.patient.user?.firstName || 'Unknown'} ${app.patient.user?.lastName || ''}`,
            doctorName: `Dr. ${app.doctor.user?.firstName || 'Unknown'}`,
            date: app.appointmentDate,
            time: app.appointmentTime,
            status: app.status,
        }));
    }
}
