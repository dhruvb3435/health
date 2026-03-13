import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DischargeSummary, DischargeStatus } from './entities/discharge-summary.entity';
import { CreateDischargeSummaryDto, UpdateDischargeSummaryDto, UpdateDischargeStatusDto } from './dto/discharge-summary.dto';

@Injectable()
export class DischargeSummaryService {
    constructor(
        @InjectRepository(DischargeSummary)
        private readonly repo: Repository<DischargeSummary>,
    ) {}

    async findAll(organizationId: string, query: { status?: string; page?: number; limit?: number }) {
        const page = query.page || 1;
        const limit = query.limit || 20;

        const qb = this.repo.createQueryBuilder('ds')
            .leftJoinAndSelect('ds.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'patientUser')
            .leftJoinAndSelect('ds.doctor', 'doctor')
            .leftJoinAndSelect('doctor.user', 'doctorUser')
            .where('ds.organizationId = :organizationId', { organizationId })
            .orderBy('ds.createdAt', 'DESC');

        if (query.status) {
            qb.andWhere('ds.status = :status', { status: query.status });
        }

        const [data, total] = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string, organizationId: string) {
        const summary = await this.repo.findOne({
            where: { id, organizationId },
            relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
        });
        if (!summary) throw new NotFoundException('Discharge summary not found');
        return summary;
    }

    async create(organizationId: string, dto: CreateDischargeSummaryDto) {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const prefix = `DIS-${today}-`;

        // Use MAX-based approach to avoid race condition with count-based IDs
        const result = await this.repo
            .createQueryBuilder('ds')
            .where('ds.organizationId = :organizationId', { organizationId })
            .andWhere('ds.summaryNumber LIKE :prefix', { prefix: `${prefix}%` })
            .select('MAX(ds.summaryNumber)', 'maxNum')
            .getRawOne();

        let nextNumber = 1;
        if (result?.maxNum) {
            const numericPart = result.maxNum.split('-').pop();
            nextNumber = parseInt(numericPart, 10) + 1;
        }

        const summaryNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;

        const summary = this.repo.create({
            ...dto,
            organizationId,
            summaryNumber,
            status: DischargeStatus.DRAFT,
        });
        return this.repo.save(summary);
    }

    async update(id: string, organizationId: string, dto: UpdateDischargeSummaryDto) {
        const summary = await this.findOne(id, organizationId);
        if (summary.status === DischargeStatus.COMPLETED) {
            throw new BadRequestException('Cannot edit a completed discharge summary');
        }
        Object.assign(summary, dto);
        return this.repo.save(summary);
    }

    async updateStatus(id: string, organizationId: string, dto: UpdateDischargeStatusDto, userId?: string) {
        const summary = await this.findOne(id, organizationId);

        if (summary.status === DischargeStatus.COMPLETED) {
            throw new BadRequestException('Summary already completed');
        }

        summary.status = dto.status;

        if (dto.status === DischargeStatus.APPROVED) {
            summary.approvedById = userId || null;
            summary.approvedAt = new Date();
        }

        return this.repo.save(summary);
    }

    async remove(id: string, organizationId: string) {
        const summary = await this.findOne(id, organizationId);
        if (summary.status !== DischargeStatus.DRAFT) {
            throw new BadRequestException('Only draft summaries can be deleted');
        }
        return this.repo.remove(summary);
    }

    async getStats(organizationId: string) {
        const stats = await this.repo.createQueryBuilder('ds')
            .select('ds.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('ds.organizationId = :organizationId', { organizationId })
            .groupBy('ds.status')
            .getRawMany();

        return stats.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {});
    }
}
