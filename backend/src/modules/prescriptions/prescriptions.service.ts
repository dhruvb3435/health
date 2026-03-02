import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto/create-prescription.dto';

import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    private readonly tenantService: TenantService,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Prescription>> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const organizationId = this.tenantService.getTenantId();
    const [data, total] = await this.prescriptionRepo.findAndCount({
      where: { organizationId },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
      order: { issuedDate: 'DESC' },
      take: limit,
      skip,
    });

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
    const organizationId = this.tenantService.getTenantId();
    const prescription = await this.prescriptionRepo.findOne({
      where: { id, organizationId },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }

    return prescription;
  }

  async create(createPrescriptionDto: CreatePrescriptionDto) {
    const organizationId = this.tenantService.getTenantId();
    const prescription = this.prescriptionRepo.create({
      ...createPrescriptionDto,
      organizationId,
    });
    return this.prescriptionRepo.save(prescription);
  }

  async update(id: string, updatePrescriptionDto: UpdatePrescriptionDto) {
    const prescription = await this.findOne(id);
    Object.assign(prescription, updatePrescriptionDto);
    return this.prescriptionRepo.save(prescription);
  }

  async remove(id: string) {
    const prescription = await this.findOne(id);
    return this.prescriptionRepo.softRemove(prescription);
  }
}
