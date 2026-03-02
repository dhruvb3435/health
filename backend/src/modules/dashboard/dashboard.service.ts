import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Invoice } from '../billing/entities/invoice.entity';
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
        private readonly tenantService: TenantService,
    ) { }

    async getStats() {
        const organizationId = this.tenantService.getTenantId();
        const [totalPatients, totalDoctors, totalAppointments] = await Promise.all([
            this.patientRepo.count({ where: { organizationId } }),
            this.doctorRepo.count({ where: { organizationId } }),
            this.appointmentRepo.count({ where: { organizationId } }),
        ]);

        // Real revenue calculation
        const revenueResult = await this.invoiceRepo
            .createQueryBuilder('invoice')
            .where('invoice.organizationId = :organizationId', { organizationId })
            .select('SUM(invoice.totalAmount)', 'total')
            .getRawOne();

        return {
            totalPatients,
            totalDoctors,
            totalAppointments,
            revenue: parseFloat(revenueResult?.total || '0'),
            change: {
                patients: '+12%',
                appointments: '+8%',
                doctors: '+2%',
                revenue: '+23%',
            },
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
        const recentAppointments = await this.appointmentRepo.find({
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
