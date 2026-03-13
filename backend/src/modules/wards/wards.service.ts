import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Ward, Bed, BedStatus } from './entities/ward.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateWardDto, UpdateWardDto } from './dto/create-ward.dto';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class WardsService {
  constructor(
    @InjectRepository(Ward)
    private readonly wardRepo: Repository<Ward>,
    @InjectRepository(Bed)
    private readonly bedRepo: Repository<Bed>,
    private readonly tenantService: TenantService,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Ward>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;
    const organizationId = this.tenantService.getTenantId();

    const where = search
      ? [
        { wardName: Like(`%${search}%`), organizationId },
        { wardCode: Like(`%${search}%`), organizationId },
      ]
      : { organizationId };

    const [data, total] = await this.wardRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
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

  async findOne(id: string) {
    const organizationId = this.tenantService.getTenantId();
    const ward = await this.wardRepo.findOne({
      where: { id, organizationId },
    });

    if (!ward) {
      throw new NotFoundException(`Ward with ID ${id} not found`);
    }

    return ward;
  }

  async create(createWardDto: CreateWardDto) {
    const organizationId = this.tenantService.getTenantId();
    const ward = this.wardRepo.create({ ...createWardDto, organizationId });
    return this.wardRepo.save(ward);
  }

  async update(id: string, updateWardDto: UpdateWardDto) {
    const ward = await this.findOne(id);
    Object.assign(ward, updateWardDto);
    return this.wardRepo.save(ward);
  }

  async remove(id: string) {
    const ward = await this.findOne(id);
    return this.wardRepo.softRemove(ward);
  }

  // Keep existing methods for compatibility
  async getAllWards() {
    const organizationId = this.tenantService.getTenantId();
    return this.wardRepo.find({ where: { organizationId } });
  }

  async getWardById(id: string) {
    return this.findOne(id);
  }

  async getAvailableBeds() {
    const organizationId = this.tenantService.getTenantId();
    return this.bedRepo.find({ where: { status: BedStatus.AVAILABLE, organizationId } });
  }

  async getBedsByWard(wardId: string) {
    const organizationId = this.tenantService.getTenantId();
    return this.bedRepo.find({ where: { wardId, organizationId } });
  }

  async getWardStats() {
    const organizationId = this.tenantService.getTenantId();
    const wards = await this.wardRepo.find({ where: { organizationId } });
    const beds = await this.bedRepo.find({ where: { organizationId } });
    return {
      totalWards: wards.length,
      totalBeds: beds.length,
      occupiedBeds: beds.filter((b) => b.status === BedStatus.OCCUPIED).length,
      availableBeds: beds.filter((b) => b.status === BedStatus.AVAILABLE).length,
    };
  }
}
