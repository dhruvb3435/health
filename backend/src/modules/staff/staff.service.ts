import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Staff, StaffRole } from './entities/staff.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';
import { TenantService } from '../../common/services/tenant.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { BCRYPT_ROUNDS } from '../../common/constants/security';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tenantService: TenantService,
    private readonly dataSource: DataSource,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Staff>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;
    const organizationId = this.tenantService.getTenantId();

    const where = search
      ? [
        { staffId: Like(`%${search}%`), organizationId },
        { user: { firstName: Like(`%${search}%`) }, organizationId },
        { user: { lastName: Like(`%${search}%`) }, organizationId },
      ]
      : { organizationId };

    const [data, total] = await this.staffRepo.findAndCount({
      where,
      relations: ['user'],
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
    const staff = await this.staffRepo.findOne({
      where: { id, organizationId },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    return staff;
  }

  async create(createStaffDto: CreateStaffDto) {
    const { email, firstName, lastName, phoneNumber, ...staffData } = createStaffDto;
    const organizationId = this.tenantService.getTenantId();

    return await this.dataSource.transaction(async (manager) => {
      const existingUser = await manager.findOne(User, { where: { email, organizationId } });
      if (existingUser) {
        throw new ConflictException('Email already registered for this organization');
      }

      const hashedPassword = await bcrypt.hash(randomUUID(), BCRYPT_ROUNDS);
      const user = manager.create(User, {
        email,
        firstName,
        lastName,
        phoneNumber,
        password: hashedPassword,
        roles: [] as any,
        status: UserStatus.ACTIVE,
        userId: staffData.staffId,
        emailVerified: true,
        organizationId,
      });

      const savedUser = await manager.save(user);

      const staff = manager.create(Staff, {
        ...staffData,
        user: savedUser,
        userId: savedUser.id,
        organizationId,
      });

      return manager.save(staff);
    });
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const staff = await this.findOne(id);
    const { firstName, lastName, phoneNumber, ...staffData } = updateStaffDto;

    if (firstName || lastName || phoneNumber) {
      Object.assign(staff.user, { firstName, lastName, phoneNumber });
      await this.userRepo.save(staff.user);
    }

    Object.assign(staff, staffData);
    return this.staffRepo.save(staff);
  }

  async remove(id: string) {
    const staff = await this.findOne(id);
    return this.staffRepo.softRemove(staff);
  }

  async getAllStaff(skip = 0, take = 10) {
    const organizationId = this.tenantService.getTenantId();
    const [staff, total] = await this.staffRepo.findAndCount({
      where: { organizationId },
      relations: ['user'],
      skip,
      take,
    });
    return { data: staff, total, count: staff.length };
  }

  async getStaffById(id: string) {
    return this.findOne(id);
  }

  async getStaffByRole(role: any) {
    const organizationId = this.tenantService.getTenantId();
    return this.staffRepo.find({
      where: { role, organizationId },
      relations: ['user'],
    });
  }
}
