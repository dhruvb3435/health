import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { OperationTheater, Surgery } from './entities/operation-theater.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateSurgeryDto, UpdateSurgeryDto } from './dto/create-surgery.dto';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class OperationTheaterService {
  constructor(
    @InjectRepository(OperationTheater)
    private readonly theaterRepo: Repository<OperationTheater>,
    @InjectRepository(Surgery)
    private readonly surgeryRepo: Repository<Surgery>,
    private readonly tenantService: TenantService,
  ) { }

  async findAllSurgeries(query: PaginationQueryDto): Promise<PaginatedResponse<Surgery>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;
    const organizationId = this.tenantService.getTenantId();

    const where = search
      ? [
        { surgeryId: Like(`%${search}%`), organizationId },
        { surgeryType: Like(`%${search}%`), organizationId },
      ]
      : { organizationId };

    const [data, total] = await this.surgeryRepo.findAndCount({
      where,
      relations: ['patient', 'patient.user', 'surgeon', 'surgeon.user'],
      order: { scheduledDate: 'DESC' },
      take: limit,
      skip,
    });

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneSurgery(id: string) {
    const organizationId = this.tenantService.getTenantId();
    const surgery = await this.surgeryRepo.findOne({
      where: { id, organizationId },
      relations: ['patient', 'patient.user', 'surgeon', 'surgeon.user'],
    });

    if (!surgery) {
      throw new NotFoundException(`Surgery with ID ${id} not found`);
    }

    return surgery;
  }

  async createSurgery(createSurgeryDto: CreateSurgeryDto) {
    const organizationId = this.tenantService.getTenantId();
    const surgery = this.surgeryRepo.create({
      ...createSurgeryDto,
      organizationId,
    });
    return this.surgeryRepo.save(surgery);
  }

  async updateSurgery(id: string, updateSurgeryDto: UpdateSurgeryDto) {
    const surgery = await this.findOneSurgery(id);
    Object.assign(surgery, updateSurgeryDto);
    return this.surgeryRepo.save(surgery);
  }

  async removeSurgery(id: string) {
    const surgery = await this.findOneSurgery(id);
    return this.surgeryRepo.softRemove(surgery);
  }

  async getAvailableTheaters() {
    const organizationId = this.tenantService.getTenantId();
    return this.theaterRepo.find({ where: { isAvailable: true, organizationId } });
  }

  async getScheduledSurgeries(skip = 0, take = 10) {
    const organizationId = this.tenantService.getTenantId();
    const [surgeries, total] = await this.surgeryRepo.findAndCount({
      where: { organizationId },
      skip,
      take,
    });
    return { data: surgeries, total, count: surgeries.length };
  }

  async getSurgeriesByPatient(patientId: string) {
    const organizationId = this.tenantService.getTenantId();
    return this.surgeryRepo.find({ where: { patientId, organizationId } });
  }

  async getSurgeriesBySurgeon(surgeonId: string) {
    const organizationId = this.tenantService.getTenantId();
    return this.surgeryRepo.find({ where: { surgeonId, organizationId } });
  }
}
