import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BloodInventory,
  BloodRequest,
  BloodGroup,
  BloodComponent,
  InventoryStatus,
  RequestStatus,
} from './entities/blood-bank.entity';
import {
  CreateBloodInventoryDto,
  UpdateBloodInventoryDto,
  CreateBloodRequestDto,
  UpdateBloodRequestStatusDto,
  InventoryFilterDto,
  RequestFilterDto,
} from './dto/blood-bank.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class BloodBankService {
  constructor(
    @InjectRepository(BloodInventory)
    private readonly inventoryRepo: Repository<BloodInventory>,
    @InjectRepository(BloodRequest)
    private readonly requestRepo: Repository<BloodRequest>,
    private readonly tenantService: TenantService,
  ) {}

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------

  async getInventory(filters: InventoryFilterDto): Promise<PaginatedResponse<BloodInventory>> {
    const { page = 1, limit = 20, search, bloodGroup, component, status } = filters;
    const skip = (page - 1) * limit;
    const organizationId = this.tenantService.getTenantId();

    const qb = this.inventoryRepo
      .createQueryBuilder('inv')
      .where('inv.organizationId = :organizationId', { organizationId });

    if (bloodGroup) {
      qb.andWhere('inv.bloodGroup = :bloodGroup', { bloodGroup });
    }
    if (component) {
      qb.andWhere('inv.component = :component', { component });
    }
    if (status) {
      qb.andWhere('inv.status = :status', { status });
    }
    if (search) {
      qb.andWhere(
        '(inv.bagNumber ILIKE :search OR inv.donorName ILIKE :search OR inv.storageLocation ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('inv.expiryDate', 'ASC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    // Flag units that have passed expiry but are still marked available
    const now = new Date();
    const enrichedData = data.map((unit) => ({
      ...unit,
      isExpired: unit.expiryDate ? new Date(unit.expiryDate) < now : false,
    }));

    return {
      data: enrichedData as BloodInventory[],
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInventoryStats(organizationId: string): Promise<Record<string, any>> {
    // Count by blood group × status
    const raw = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('inv.bloodGroup', 'bloodGroup')
      .addSelect('inv.status', 'status')
      .addSelect('SUM(inv.units)', 'totalUnits')
      .addSelect('COUNT(inv.id)', 'bagCount')
      .where('inv.organizationId = :organizationId', { organizationId })
      .groupBy('inv.bloodGroup')
      .addGroupBy('inv.status')
      .getRawMany();

    // Total available units across all groups (most useful quick metric)
    const totalAvailable = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.units)', 'total')
      .where('inv.organizationId = :organizationId', { organizationId })
      .andWhere('inv.status = :status', { status: InventoryStatus.AVAILABLE })
      .getRawOne();

    // Expiring within the next 7 days
    const soonExpiry = new Date();
    soonExpiry.setDate(soonExpiry.getDate() + 7);
    const expiringCount = await this.inventoryRepo
      .createQueryBuilder('inv')
      .where('inv.organizationId = :organizationId', { organizationId })
      .andWhere('inv.status = :status', { status: InventoryStatus.AVAILABLE })
      .andWhere('inv.expiryDate <= :soonExpiry', { soonExpiry })
      .getCount();

    // Shape the breakdown by blood group
    const byBloodGroup: Record<string, Record<string, number>> = {};
    for (const row of raw) {
      if (!byBloodGroup[row.bloodGroup]) {
        byBloodGroup[row.bloodGroup] = {};
      }
      byBloodGroup[row.bloodGroup][row.status] = Number(row.totalUnits);
    }

    return {
      totalAvailableUnits: Number(totalAvailable?.total ?? 0),
      expiringWithin7Days: expiringCount,
      byBloodGroup,
    };
  }

  async addBloodUnit(dto: CreateBloodInventoryDto): Promise<BloodInventory> {
    const organizationId = this.tenantService.getTenantId();

    // Bag numbers must be globally unique within an organization
    const existing = await this.inventoryRepo.findOne({
      where: { bagNumber: dto.bagNumber, organizationId },
    });
    if (existing) {
      throw new ConflictException(`Bag number "${dto.bagNumber}" already exists in the blood bank`);
    }

    // Expiry date must be after collection date
    if (new Date(dto.expiryDate) <= new Date(dto.collectedDate)) {
      throw new BadRequestException('Expiry date must be after the collected date');
    }

    const unit = this.inventoryRepo.create({ ...dto, organizationId });
    return this.inventoryRepo.save(unit);
  }

  async updateBloodUnit(id: string, dto: UpdateBloodInventoryDto): Promise<BloodInventory> {
    const unit = await this.findInventoryUnit(id);

    // If changing status to issued/discarded, protect against re-using reserved units
    if (dto.bagNumber && dto.bagNumber !== unit.bagNumber) {
      const organizationId = this.tenantService.getTenantId();
      const conflict = await this.inventoryRepo.findOne({
        where: { bagNumber: dto.bagNumber, organizationId },
      });
      if (conflict) {
        throw new ConflictException(`Bag number "${dto.bagNumber}" is already taken`);
      }
    }

    Object.assign(unit, dto);
    return this.inventoryRepo.save(unit);
  }

  async removeBloodUnit(id: string): Promise<void> {
    const unit = await this.findInventoryUnit(id);

    if (unit.status === InventoryStatus.RESERVED || unit.status === InventoryStatus.ISSUED) {
      throw new BadRequestException(
        `Cannot delete a blood unit that is currently ${unit.status}. Update its status first.`,
      );
    }

    await this.inventoryRepo.remove(unit);
  }

  // ---------------------------------------------------------------------------
  // Requests
  // ---------------------------------------------------------------------------

  async getRequests(filters: RequestFilterDto): Promise<PaginatedResponse<BloodRequest>> {
    const { page = 1, limit = 20, bloodGroup, status, priority } = filters;
    const skip = (page - 1) * limit;
    const organizationId = this.tenantService.getTenantId();

    const qb = this.requestRepo
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .leftJoinAndSelect('req.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .where('req.organizationId = :organizationId', { organizationId });

    if (bloodGroup) {
      qb.andWhere('req.bloodGroup = :bloodGroup', { bloodGroup });
    }
    if (status) {
      qb.andWhere('req.status = :status', { status });
    }
    if (priority) {
      qb.andWhere('req.priority = :priority', { priority });
    }

    // Emergency/urgent first, then by request date descending
    qb.orderBy(
      `CASE req.priority WHEN 'emergency' THEN 1 WHEN 'urgent' THEN 2 ELSE 3 END`,
      'ASC',
    ).addOrderBy('req.requestDate', 'DESC');

    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

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

  async createRequest(dto: CreateBloodRequestDto): Promise<BloodRequest> {
    const organizationId = this.tenantService.getTenantId();

    const request = this.requestRepo.create({
      ...dto,
      organizationId,
      requestDate: new Date(),
    });

    return this.requestRepo.save(request);
  }

  async updateRequestStatus(id: string, dto: UpdateBloodRequestStatusDto): Promise<BloodRequest> {
    const organizationId = this.tenantService.getTenantId();
    const request = await this.findRequest(id);

    // Guard against invalid transitions
    this.validateStatusTransition(request.status, dto.status);

    if (dto.status === RequestStatus.ISSUED) {
      if (!dto.unitsIssued || dto.unitsIssued <= 0) {
        throw new BadRequestException('unitsIssued must be provided and greater than 0 when issuing blood');
      }

      if (dto.unitsIssued > request.unitsRequested) {
        throw new BadRequestException(
          `Cannot issue ${dto.unitsIssued} units — only ${request.unitsRequested} were requested`,
        );
      }

      // Auto-deduct from available inventory (FIFO by expiry date)
      await this.deductFromInventory(
        organizationId,
        request.bloodGroup,
        request.component,
        dto.unitsIssued,
      );

      request.unitsIssued = dto.unitsIssued;
      request.issuedDate = new Date();
    }

    request.status = dto.status;

    if (dto.notes !== undefined) {
      request.notes = dto.notes;
    }

    return this.requestRepo.save(request);
  }

  async checkAvailability(
    bloodGroup: BloodGroup,
    component: BloodComponent,
  ): Promise<{ bloodGroup: BloodGroup; component: BloodComponent; availableUnits: number; bagCount: number }> {
    const organizationId = this.tenantService.getTenantId();

    const result = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.units)', 'totalUnits')
      .addSelect('COUNT(inv.id)', 'bagCount')
      .where('inv.organizationId = :organizationId', { organizationId })
      .andWhere('inv.bloodGroup = :bloodGroup', { bloodGroup })
      .andWhere('inv.component = :component', { component })
      .andWhere('inv.status = :status', { status: InventoryStatus.AVAILABLE })
      .andWhere('inv.expiryDate > :now', { now: new Date() })
      .getRawOne();

    return {
      bloodGroup,
      component,
      availableUnits: Number(result?.totalUnits ?? 0),
      bagCount: Number(result?.bagCount ?? 0),
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async findInventoryUnit(id: string): Promise<BloodInventory> {
    const organizationId = this.tenantService.getTenantId();
    const unit = await this.inventoryRepo.findOne({ where: { id, organizationId } });
    if (!unit) {
      throw new NotFoundException(`Blood inventory unit with ID ${id} not found`);
    }
    return unit;
  }

  private async findRequest(id: string): Promise<BloodRequest> {
    const organizationId = this.tenantService.getTenantId();
    const request = await this.requestRepo.findOne({
      where: { id, organizationId },
      relations: ['patient', 'doctor'],
    });
    if (!request) {
      throw new NotFoundException(`Blood request with ID ${id} not found`);
    }
    return request;
  }

  /**
   * Deducts units from available inventory using FIFO order (earliest expiry first).
   * Marks bags as ISSUED once all their units are consumed.
   * Throws BadRequestException if total available units are insufficient.
   */
  private async deductFromInventory(
    organizationId: string,
    bloodGroup: BloodGroup,
    component: BloodComponent,
    unitsNeeded: number,
  ): Promise<void> {
    const availableBags = await this.inventoryRepo.find({
      where: {
        organizationId,
        bloodGroup,
        component,
        status: InventoryStatus.AVAILABLE,
      },
      order: { expiryDate: 'ASC' },
    });

    const totalAvailable = availableBags.reduce((sum, bag) => sum + bag.units, 0);

    if (totalAvailable < unitsNeeded) {
      throw new BadRequestException(
        `Insufficient blood units available. Requested: ${unitsNeeded}, Available: ${totalAvailable} (${bloodGroup} ${component})`,
      );
    }

    let remaining = unitsNeeded;

    for (const bag of availableBags) {
      if (remaining <= 0) break;

      if (bag.units <= remaining) {
        remaining -= bag.units;
        bag.units = 0;
        bag.status = InventoryStatus.ISSUED;
      } else {
        bag.units -= remaining;
        remaining = 0;
      }

      await this.inventoryRepo.save(bag);
    }
  }

  /**
   * Enforces allowed request status transitions to prevent invalid state changes.
   */
  private validateStatusTransition(current: RequestStatus, next: RequestStatus): void {
    const allowed: Record<RequestStatus, RequestStatus[]> = {
      [RequestStatus.PENDING]: [RequestStatus.APPROVED, RequestStatus.CANCELLED],
      [RequestStatus.APPROVED]: [RequestStatus.ISSUED, RequestStatus.CANCELLED],
      [RequestStatus.ISSUED]: [RequestStatus.COMPLETED],
      [RequestStatus.COMPLETED]: [],
      [RequestStatus.CANCELLED]: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(
        `Cannot transition blood request from "${current}" to "${next}"`,
      );
    }
  }
}
