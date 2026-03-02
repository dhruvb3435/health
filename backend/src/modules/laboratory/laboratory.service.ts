import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabTest } from './entities/lab-test.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateLabTestDto, UpdateLabTestDto } from './dto/create-lab-test.dto';

import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class LaboratoryService {
    constructor(
        @InjectRepository(LabTest)
        private readonly labTestRepo: Repository<LabTest>,
        private readonly tenantService: TenantService,
    ) { }

    async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<LabTest>> {
        const { page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const organizationId = this.tenantService.getTenantId();
        const [data, total] = await this.labTestRepo.findAndCount({
            where: { organizationId },
            relations: ['patient', 'patient.user'],
            order: { createdAt: 'DESC' },
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
        const labTest = await this.labTestRepo.findOne({
            where: { id, organizationId },
            relations: ['patient', 'patient.user'],
        });

        if (!labTest) {
            throw new NotFoundException(`Lab test with ID ${id} not found`);
        }

        return labTest;
    }

    async create(createLabTestDto: CreateLabTestDto) {
        const organizationId = this.tenantService.getTenantId();
        const labTest = this.labTestRepo.create({
            ...createLabTestDto,
            organizationId,
        });
        return this.labTestRepo.save(labTest);
    }

    async update(id: string, updateLabTestDto: UpdateLabTestDto) {
        const labTest = await this.findOne(id);
        Object.assign(labTest, updateLabTestDto);
        return this.labTestRepo.save(labTest);
    }

    async remove(id: string) {
        const labTest = await this.findOne(id);
        return this.labTestRepo.remove(labTest);
    }
}
