import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpdQueue, QueueStatus } from './entities/opd-queue.entity';
import { CreateOpdQueueDto, UpdateQueueStatusDto } from './dto/create-opd-queue.dto';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class OpdQueueService {
  constructor(
    @InjectRepository(OpdQueue)
    private readonly queueRepo: Repository<OpdQueue>,
    private readonly tenantService: TenantService,
  ) {}

  async getTodayQueue(doctorId?: string) {
    const organizationId = this.tenantService.getTenantId();
    const today = new Date().toISOString().split('T')[0];

    const qb = this.queueRepo.createQueryBuilder('q')
      .where('q.organizationId = :organizationId', { organizationId })
      .andWhere('q.queueDate = :today', { today })
      .leftJoinAndSelect('q.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .leftJoinAndSelect('q.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .orderBy('q.priority', 'DESC') // emergency first
      .addOrderBy('q.tokenNumber', 'ASC');

    if (doctorId) {
      qb.andWhere('q.doctorId = :doctorId', { doctorId });
    }

    const data = await qb.getMany();

    const waiting = data.filter(q => q.status === QueueStatus.WAITING).length;
    const inConsultation = data.filter(q => q.status === QueueStatus.IN_CONSULTATION).length;
    const completed = data.filter(q => q.status === QueueStatus.COMPLETED).length;

    return {
      data,
      stats: { waiting, inConsultation, completed, total: data.length },
    };
  }

  async checkinPatient(dto: CreateOpdQueueDto) {
    const organizationId = this.tenantService.getTenantId();
    const today = new Date().toISOString().split('T')[0];

    // Get next token number for today
    const lastToken = await this.queueRepo
      .createQueryBuilder('q')
      .where('q.organizationId = :organizationId', { organizationId })
      .andWhere('q.queueDate = :today', { today })
      .orderBy('q.tokenNumber', 'DESC')
      .getOne();

    const tokenNumber = (lastToken?.tokenNumber || 0) + 1;

    // Check if patient already in queue today for same doctor
    const existing = await this.queueRepo.findOne({
      where: {
        organizationId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        queueDate: new Date(today) as any,
        status: QueueStatus.WAITING,
      },
    });

    if (existing) {
      throw new ConflictException('Patient is already in the queue for this doctor today');
    }

    const entry = this.queueRepo.create({
      ...dto,
      organizationId,
      tokenNumber,
      queueDate: new Date(today),
      checkinTime: new Date(),
      status: QueueStatus.WAITING,
    });

    return this.queueRepo.save(entry);
  }

  async updateStatus(id: string, dto: UpdateQueueStatusDto) {
    const organizationId = this.tenantService.getTenantId();
    const entry = await this.queueRepo.findOne({
      where: { id, organizationId },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
    });

    if (!entry) {
      throw new NotFoundException('Queue entry not found');
    }

    entry.status = dto.status;
    if (dto.notes) entry.notes = dto.notes;

    if (dto.status === QueueStatus.IN_CONSULTATION && !entry.consultationStartTime) {
      entry.consultationStartTime = new Date();
    }

    if (dto.status === QueueStatus.COMPLETED && !entry.consultationEndTime) {
      entry.consultationEndTime = new Date();
    }

    return this.queueRepo.save(entry);
  }

  async findOne(id: string) {
    const organizationId = this.tenantService.getTenantId();
    const entry = await this.queueRepo.findOne({
      where: { id, organizationId },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
    });

    if (!entry) {
      throw new NotFoundException('Queue entry not found');
    }

    return entry;
  }

  async getQueueStats() {
    const organizationId = this.tenantService.getTenantId();
    const today = new Date().toISOString().split('T')[0];

    const result = await this.queueRepo
      .createQueryBuilder('q')
      .select('q.status', 'status')
      .addSelect('COUNT(q.id)', 'count')
      .where('q.organizationId = :organizationId', { organizationId })
      .andWhere('q.queueDate = :today', { today })
      .groupBy('q.status')
      .getRawMany();

    const stats: Record<string, number> = {};
    result.forEach(r => { stats[r.status] = parseInt(r.count); });

    // Average wait time (for completed consultations)
    const avgWait = await this.queueRepo
      .createQueryBuilder('q')
      .select('AVG(EXTRACT(EPOCH FROM (q.consultationStartTime - q.checkinTime)))', 'avgWaitSeconds')
      .where('q.organizationId = :organizationId', { organizationId })
      .andWhere('q.queueDate = :today', { today })
      .andWhere('q.consultationStartTime IS NOT NULL')
      .andWhere('q.checkinTime IS NOT NULL')
      .getRawOne();

    return {
      waiting: stats[QueueStatus.WAITING] || 0,
      inConsultation: stats[QueueStatus.IN_CONSULTATION] || 0,
      completed: stats[QueueStatus.COMPLETED] || 0,
      cancelled: stats[QueueStatus.CANCELLED] || 0,
      noShow: stats[QueueStatus.NO_SHOW] || 0,
      averageWaitMinutes: avgWait?.avgWaitSeconds ? Math.round(parseFloat(avgWait.avgWaitSeconds) / 60) : 0,
    };
  }

  async remove(id: string) {
    const organizationId = this.tenantService.getTenantId();
    const entry = await this.queueRepo.findOne({ where: { id, organizationId } });
    if (!entry) throw new NotFoundException('Queue entry not found');
    return this.queueRepo.remove(entry);
  }
}
