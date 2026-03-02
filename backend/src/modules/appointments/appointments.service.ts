import { Injectable, NotFoundException } from '@nestjs/common';
import { Appointment } from './entities/appointment.entity';
import { AppointmentPaginationDto } from './dto/appointment-pagination.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { AppointmentRepository } from './repositories/appointment.repository';
import { TenantService } from '../../common/services/tenant.service';
import { MailService } from '../mail/mail.service';
import { UsageService } from '../subscriptions/usage.service';
import { DataSource } from 'typeorm';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly tenantService: TenantService,
    private readonly mailService: MailService,
    private readonly usageService: UsageService,
    private readonly dataSource: DataSource,
  ) { }

  async findAll(query: AppointmentPaginationDto): Promise<PaginatedResponse<Appointment>> {
    const { patientId, doctorId, status, dateFrom, dateTo } = query;
    const organizationId = this.tenantService.getTenantId();
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    // Create query builder to handle selective filters
    const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment');
    queryBuilder.where('appointment.organizationId = :organizationId', { organizationId });

    if (patientId) {
      queryBuilder.andWhere('appointment.patientId = :patientId', { patientId });
    }
    if (doctorId) {
      queryBuilder.andWhere('appointment.doctorId = :doctorId', { doctorId });
    }
    if (status) {
      queryBuilder.andWhere('appointment.status = :status', { status });
    }
    if (dateFrom) {
      queryBuilder.andWhere('appointment.appointmentDate >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      queryBuilder.andWhere('appointment.appointmentDate <= :dateTo', { dateTo });
    }

    // Join relations
    queryBuilder
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'docUser')
      .orderBy(`appointment.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async create(createAppointmentDto: any) {
    const { doctorId, appointmentDate } = createAppointmentDto;
    const organizationId = this.tenantService.getTenantId();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const manager = queryRunner.manager;

      const todayCount = await manager.count(Appointment, {
        where: {
          doctorId,
          appointmentDate: new Date(appointmentDate),
          organizationId,
        },
      });
      const tokenNumber = todayCount + 1;

      const appointment = manager.create(Appointment, {
        ...createAppointmentDto,
        tokenNumber,
        organizationId,
      });
      const savedAppointment = await manager.save(appointment);
      const appointmentId = (savedAppointment as any).id;

      // Increment usage
      await this.usageService.increment(organizationId, 'MAX_APPOINTMENTS', manager);

      // Fetch details for email
      const detailedAppointment = await manager.findOne(Appointment, {
        where: { id: appointmentId },
        relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
      });
      if (detailedAppointment) {
        await this.mailService.sendAppointmentConfirmation(detailedAppointment);
      }

      await queryRunner.commitTransaction();
      return savedAppointment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateAppointmentDto: any) {
    const appointment = await this.findOne(id);
    Object.assign(appointment, updateAppointmentDto);
    return this.appointmentRepository.save(appointment);
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);
    return this.appointmentRepository.softRemove(appointment);
  }
}
