import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Ward, Bed, BedStatus } from './entities/ward.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateWardDto, UpdateWardDto } from './dto/create-ward.dto';

@Injectable()
export class WardsService {
  constructor(
    @InjectRepository(Ward)
    private readonly wardRepo: Repository<Ward>,
    @InjectRepository(Bed)
    private readonly bedRepo: Repository<Bed>,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Ward>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
        { wardName: Like(`%${search}%`) },
        { wardCode: Like(`%${search}%`) },
      ]
      : {};

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
    const ward = await this.wardRepo.findOne({
      where: { id },
    });

    if (!ward) {
      throw new NotFoundException(`Ward with ID ${id} not found`);
    }

    return ward;
  }

  async create(createWardDto: CreateWardDto) {
    const ward = this.wardRepo.create(createWardDto);
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
    return this.wardRepo.find();
  }

  async getWardById(id: string) {
    return this.findOne(id);
  }

  async getAvailableBeds() {
    return this.bedRepo.find({ where: { status: BedStatus.AVAILABLE } });
  }

  async getBedsByWard(wardId: string) {
    return this.bedRepo.find({ where: { wardId } });
  }

  async getWardStats() {
    const wards = await this.wardRepo.find();
    const beds = await this.bedRepo.find();
    return {
      totalWards: wards.length,
      totalBeds: beds.length,
      occupiedBeds: beds.filter((b) => b.status === BedStatus.OCCUPIED).length,
      availableBeds: beds.filter((b) => b.status === BedStatus.AVAILABLE).length,
    };
  }
}
