import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Inventory, InventoryStatus, InventoryType } from './entities/inventory.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/create-inventory.dto';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    private readonly tenantService: TenantService,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Inventory>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;
    const organizationId = this.tenantService.getTenantId();

    const where = search
      ? [
        { itemName: Like(`%${search}%`), organizationId },
        { itemCode: Like(`%${search}%`), organizationId },
        { category: Like(`%${search}%`), organizationId },
      ]
      : { organizationId };

    const [data, total] = await this.inventoryRepo.findAndCount({
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
    const item = await this.inventoryRepo.findOne({
      where: { id, organizationId },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return item;
  }

  async create(createInventoryDto: CreateInventoryDto) {
    const organizationId = this.tenantService.getTenantId();
    const item = this.inventoryRepo.create({ ...createInventoryDto, organizationId });
    return this.inventoryRepo.save(item);
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    const item = await this.findOne(id);
    Object.assign(item, updateInventoryDto);
    return this.inventoryRepo.save(item);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    return this.inventoryRepo.softRemove(item);
  }

  // Keep existing methods for compatibility
  async getAllInventory(skip = 0, take = 10) {
    const [items, total] = await this.inventoryRepo.findAndCount({
      skip,
      take,
    });
    return { data: items, total, count: items.length };
  }

  async getByType(type: InventoryType) {
    return this.inventoryRepo.find({ where: { type } });
  }

  async getLowStockItems() {
    const organizationId = this.tenantService.getTenantId();
    return this.inventoryRepo.find({
      where: { status: InventoryStatus.LOW_STOCK, organizationId },
    });
  }

  async getExpiredItems() {
    const organizationId = this.tenantService.getTenantId();
    return this.inventoryRepo.find({
      where: { status: InventoryStatus.EXPIRED, organizationId },
    });
  }

  async getStockValue() {
    const organizationId = this.tenantService.getTenantId();
    const { sum } = await this.inventoryRepo
      .createQueryBuilder('inventory')
      .where('inventory.organizationId = :organizationId', { organizationId })
      .select('SUM(inventory.quantity * inventory.unitCost)', 'sum')
      .getRawOne();
    return parseFloat(sum || '0');
  }
}
