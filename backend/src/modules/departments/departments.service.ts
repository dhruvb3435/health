import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Department } from './entities/department.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    private readonly tenantService: TenantService,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Department>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;
    const organizationId = this.tenantService.getTenantId();

    const where = search
      ? { name: Like(`%${search}%`), organizationId }
      : { organizationId };

    const [data, total] = await this.departmentRepo.findAndCount({
      where,
      relations: ['parentDepartment'],
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
    const department = await this.departmentRepo.findOne({
      where: { id, organizationId },
      relations: ['parentDepartment'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async create(createDepartmentDto: CreateDepartmentDto) {
    const organizationId = this.tenantService.getTenantId();

    const existing = await this.departmentRepo.findOne({
      where: { name: createDepartmentDto.name, organizationId },
    });

    if (existing) {
      throw new ConflictException(`Department with name "${createDepartmentDto.name}" already exists`);
    }

    const department = this.departmentRepo.create({
      ...createDepartmentDto,
      organizationId,
    });

    return this.departmentRepo.save(department);
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.findOne(id);

    if (updateDepartmentDto.name && updateDepartmentDto.name !== department.name) {
      const organizationId = this.tenantService.getTenantId();
      const existing = await this.departmentRepo.findOne({
        where: { name: updateDepartmentDto.name, organizationId },
      });

      if (existing) {
        throw new ConflictException(`Department with name "${updateDepartmentDto.name}" already exists`);
      }
    }

    Object.assign(department, updateDepartmentDto);
    return this.departmentRepo.save(department);
  }

  async remove(id: string) {
    const department = await this.findOne(id);
    return this.departmentRepo.softRemove(department);
  }
}
