import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InsuranceProvider,
  InsuranceClaim,
  ClaimStatus,
} from './entities/insurance.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import {
  CreateInsuranceProviderDto,
  UpdateInsuranceProviderDto,
  CreateInsuranceClaimDto,
  UpdateInsuranceClaimDto,
  UpdateClaimStatusDto,
  ProviderFilterDto,
  ClaimFilterDto,
} from './dto/insurance.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class InsuranceService {
  constructor(
    @InjectRepository(InsuranceProvider)
    private readonly providerRepo: Repository<InsuranceProvider>,
    @InjectRepository(InsuranceClaim)
    private readonly claimRepo: Repository<InsuranceClaim>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly tenantService: TenantService,
  ) {}

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------

  async getProviders(filters: ProviderFilterDto): Promise<InsuranceProvider[]> {
    const organizationId = this.tenantService.getTenantId();

    const qb = this.providerRepo
      .createQueryBuilder('p')
      .where('p.organizationId = :organizationId', { organizationId });

    if (filters.search) {
      qb.andWhere(
        '(p.providerName ILIKE :search OR p.providerCode ILIKE :search OR p.contactPerson ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.isActive !== undefined) {
      qb.andWhere('p.isActive = :isActive', { isActive: filters.isActive });
    }

    return qb.orderBy('p.providerName', 'ASC').getMany();
  }

  async createProvider(dto: CreateInsuranceProviderDto): Promise<InsuranceProvider> {
    const organizationId = this.tenantService.getTenantId();

    // providerCode must be unique within the organization
    const existing = await this.providerRepo.findOne({
      where: { providerCode: dto.providerCode, organizationId },
    });
    if (existing) {
      throw new ConflictException(
        `Provider code "${dto.providerCode}" is already registered in this organization`,
      );
    }

    const provider = this.providerRepo.create({ ...dto, organizationId });
    return this.providerRepo.save(provider);
  }

  async updateProvider(id: string, dto: UpdateInsuranceProviderDto): Promise<InsuranceProvider> {
    const provider = await this.findProviderOrFail(id);

    // If providerCode is being changed, check it does not conflict
    if (dto.providerCode && dto.providerCode !== provider.providerCode) {
      const organizationId = this.tenantService.getTenantId();
      const conflict = await this.providerRepo.findOne({
        where: { providerCode: dto.providerCode, organizationId },
      });
      if (conflict) {
        throw new ConflictException(
          `Provider code "${dto.providerCode}" is already taken`,
        );
      }
    }

    Object.assign(provider, dto);
    return this.providerRepo.save(provider);
  }

  async deleteProvider(id: string): Promise<void> {
    const provider = await this.findProviderOrFail(id);

    // Prevent deletion if any active (non-cancelled/rejected) claims reference this provider
    const activeClaims = await this.claimRepo.count({
      where: {
        providerId: id,
        organizationId: provider.organizationId,
      },
    });
    if (activeClaims > 0) {
      throw new BadRequestException(
        `Cannot delete provider "${provider.providerName}" — ${activeClaims} claim(s) are associated with it. Deactivate the provider instead.`,
      );
    }

    await this.providerRepo.remove(provider);
  }

  // ---------------------------------------------------------------------------
  // Claims
  // ---------------------------------------------------------------------------

  async getClaims(filters: ClaimFilterDto): Promise<PaginatedResponse<InsuranceClaim>> {
    const { page = 1, limit = 20, status, providerId, patientId, treatmentType, dateFrom, dateTo, search } = filters;
    const skip = (page - 1) * limit;
    const organizationId = this.tenantService.getTenantId();

    const qb = this.claimRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .leftJoinAndSelect('c.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('c.provider', 'provider')
      .where('c.organizationId = :organizationId', { organizationId });

    if (status) {
      qb.andWhere('c.status = :status', { status });
    }
    if (providerId) {
      qb.andWhere('c.providerId = :providerId', { providerId });
    }
    if (patientId) {
      qb.andWhere('c.patientId = :patientId', { patientId });
    }
    if (treatmentType) {
      qb.andWhere('c.treatmentType = :treatmentType', { treatmentType });
    }
    if (dateFrom) {
      qb.andWhere('c.submittedDate >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      qb.andWhere('c.submittedDate <= :dateTo', { dateTo });
    }
    if (search) {
      qb.andWhere(
        '(c.claimNumber ILIKE :search OR c.policyNumber ILIKE :search OR c.policyHolderName ILIKE :search OR c.tpaReferenceNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('c.createdAt', 'DESC').skip(skip).take(limit);

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

  async createClaim(dto: CreateInsuranceClaimDto): Promise<InsuranceClaim> {
    const organizationId = this.tenantService.getTenantId();

    // Validate provider exists within the same org
    const provider = await this.providerRepo.findOne({
      where: { id: dto.providerId, organizationId },
    });
    if (!provider) {
      throw new NotFoundException(`Insurance provider with ID "${dto.providerId}" not found`);
    }
    if (!provider.isActive) {
      throw new BadRequestException(`Provider "${provider.providerName}" is currently inactive`);
    }

    // Validate claim amount against invoice total when invoiceId is provided
    if (dto.invoiceId) {
      const invoice = await this.invoiceRepo.findOne({
        where: { id: dto.invoiceId, organizationId },
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID "${dto.invoiceId}" not found`);
      }
      if (dto.claimAmount > invoice.totalAmount) {
        throw new BadRequestException(
          `Claim amount (${dto.claimAmount}) cannot exceed invoice total (${invoice.totalAmount})`,
        );
      }
    }

    const claimNumber = await this.generateClaimNumber(organizationId);

    const claim = this.claimRepo.create({
      ...dto,
      organizationId,
      claimNumber,
      status: ClaimStatus.DRAFT,
    });

    return this.claimRepo.save(claim);
  }

  async updateClaim(id: string, dto: UpdateInsuranceClaimDto): Promise<InsuranceClaim> {
    const claim = await this.findClaimOrFail(id);

    // Only draft claims can be freely edited; others require status transitions
    const editableStatuses: ClaimStatus[] = [ClaimStatus.DRAFT, ClaimStatus.QUERY_RAISED];
    if (!editableStatuses.includes(claim.status)) {
      throw new BadRequestException(
        `Claim "${claim.claimNumber}" is in "${claim.status}" status and cannot be edited. Use the status endpoint for workflow transitions.`,
      );
    }

    // If changing provider, validate the new one
    if (dto.providerId && dto.providerId !== claim.providerId) {
      const organizationId = this.tenantService.getTenantId();
      const provider = await this.providerRepo.findOne({
        where: { id: dto.providerId, organizationId },
      });
      if (!provider) {
        throw new NotFoundException(`Insurance provider with ID "${dto.providerId}" not found`);
      }
      if (!provider.isActive) {
        throw new BadRequestException(`Provider "${provider.providerName}" is currently inactive`);
      }
    }

    Object.assign(claim, dto);
    return this.claimRepo.save(claim);
  }

  async updateClaimStatus(id: string, dto: UpdateClaimStatusDto): Promise<InsuranceClaim> {
    const claim = await this.findClaimOrFail(id);

    this.validateClaimStatusTransition(claim.status, dto.status);
    this.validateStatusPayload(dto);

    claim.status = dto.status;

    // Set auto-timestamps based on the new status
    const today = new Date();
    if (dto.status === ClaimStatus.SUBMITTED && !claim.submittedDate) {
      claim.submittedDate = today;
    }
    if (
      (dto.status === ClaimStatus.APPROVED || dto.status === ClaimStatus.PARTIALLY_APPROVED) &&
      !claim.approvedDate
    ) {
      claim.approvedDate = today;
    }
    if (dto.status === ClaimStatus.SETTLED && !claim.settledDate) {
      claim.settledDate = today;
    }

    // Merge financial and narrative fields from the DTO
    if (dto.approvedAmount !== undefined) {
      claim.approvedAmount = dto.approvedAmount;
    }
    if (dto.settledAmount !== undefined) {
      claim.settledAmount = dto.settledAmount;
    }
    if (dto.deductionAmount !== undefined) {
      claim.deductionAmount = dto.deductionAmount;
    }
    if (dto.deductionReason !== undefined) {
      claim.deductionReason = dto.deductionReason;
    }
    if (dto.queryDetails !== undefined) {
      claim.queryDetails = dto.queryDetails;
    }
    if (dto.rejectionReason !== undefined) {
      claim.rejectionReason = dto.rejectionReason;
    }
    if (dto.remarks !== undefined) {
      claim.remarks = dto.remarks;
    }

    return this.claimRepo.save(claim);
  }

  async getClaimById(id: string): Promise<InsuranceClaim> {
    return this.findClaimOrFail(id, true);
  }

  async getClaimStats(orgId?: string): Promise<Record<string, any>> {
    const organizationId = orgId ?? this.tenantService.getTenantId();

    // Count and sum amounts by status
    const byStatus = await this.claimRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(c.id)', 'count')
      .addSelect('SUM(c.claimAmount)', 'totalClaimAmount')
      .addSelect('SUM(c.approvedAmount)', 'totalApprovedAmount')
      .addSelect('SUM(c.settledAmount)', 'totalSettledAmount')
      .where('c.organizationId = :organizationId', { organizationId })
      .groupBy('c.status')
      .getRawMany();

    // Overall totals across all statuses
    const totals = await this.claimRepo
      .createQueryBuilder('c')
      .select('COUNT(c.id)', 'totalClaims')
      .addSelect('SUM(c.claimAmount)', 'totalClaimAmount')
      .addSelect('SUM(c.approvedAmount)', 'totalApprovedAmount')
      .addSelect('SUM(c.settledAmount)', 'totalSettledAmount')
      .addSelect('SUM(c.deductionAmount)', 'totalDeductionAmount')
      .where('c.organizationId = :organizationId', { organizationId })
      .getRawOne();

    // Pending TPA decisions (submitted + under_review + query_raised)
    const pendingCount = await this.claimRepo
      .createQueryBuilder('c')
      .where('c.organizationId = :organizationId', { organizationId })
      .andWhere('c.status IN (:...statuses)', {
        statuses: [ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW, ClaimStatus.QUERY_RAISED],
      })
      .getCount();

    const statusBreakdown: Record<string, { count: number; claimAmount: number; approvedAmount: number; settledAmount: number }> = {};
    for (const row of byStatus) {
      statusBreakdown[row.status] = {
        count: parseInt(row.count, 10),
        claimAmount: parseFloat(row.totalClaimAmount ?? '0'),
        approvedAmount: parseFloat(row.totalApprovedAmount ?? '0'),
        settledAmount: parseFloat(row.totalSettledAmount ?? '0'),
      };
    }

    return {
      totalClaims: parseInt(totals?.totalClaims ?? '0', 10),
      totalClaimAmount: parseFloat(totals?.totalClaimAmount ?? '0'),
      totalApprovedAmount: parseFloat(totals?.totalApprovedAmount ?? '0'),
      totalSettledAmount: parseFloat(totals?.totalSettledAmount ?? '0'),
      totalDeductionAmount: parseFloat(totals?.totalDeductionAmount ?? '0'),
      pendingDecisionCount: pendingCount,
      byStatus: statusBreakdown,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async findProviderOrFail(id: string): Promise<InsuranceProvider> {
    const organizationId = this.tenantService.getTenantId();
    const provider = await this.providerRepo.findOne({ where: { id, organizationId } });
    if (!provider) {
      throw new NotFoundException(`Insurance provider with ID "${id}" not found`);
    }
    return provider;
  }

  private async findClaimOrFail(id: string, withRelations = false): Promise<InsuranceClaim> {
    const organizationId = this.tenantService.getTenantId();
    const claim = await this.claimRepo.findOne({
      where: { id, organizationId },
      relations: withRelations
        ? ['patient', 'patient.user', 'doctor', 'doctor.user', 'provider']
        : [],
    });
    if (!claim) {
      throw new NotFoundException(`Insurance claim with ID "${id}" not found`);
    }
    return claim;
  }

  /**
   * Generates a sequential claim number in the format CLM-YYYYMMDD-NNN.
   * The sequence resets per calendar day; if NNN would exceed 999, it continues numerically.
   */
  private async generateClaimNumber(organizationId: string): Promise<string> {
    const today = new Date();
    const datePart = today
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, ''); // "20240615"

    const prefix = `CLM-${datePart}-`;

    // Find the highest sequential number used today for this org
    const last = await this.claimRepo
      .createQueryBuilder('c')
      .select('c.claimNumber', 'claimNumber')
      .where('c.organizationId = :organizationId', { organizationId })
      .andWhere('c.claimNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('c.claimNumber', 'DESC')
      .limit(1)
      .getRawOne();

    let sequence = 1;
    if (last?.claimNumber) {
      const parts = last.claimNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(3, '0')}`;
  }

  /**
   * Enforces valid status transitions for insurance claims.
   */
  private validateClaimStatusTransition(current: ClaimStatus, next: ClaimStatus): void {
    const allowed: Record<ClaimStatus, ClaimStatus[]> = {
      [ClaimStatus.DRAFT]: [ClaimStatus.SUBMITTED, ClaimStatus.CANCELLED],
      [ClaimStatus.SUBMITTED]: [ClaimStatus.UNDER_REVIEW, ClaimStatus.CANCELLED],
      [ClaimStatus.UNDER_REVIEW]: [
        ClaimStatus.QUERY_RAISED,
        ClaimStatus.APPROVED,
        ClaimStatus.PARTIALLY_APPROVED,
        ClaimStatus.REJECTED,
      ],
      [ClaimStatus.QUERY_RAISED]: [ClaimStatus.SUBMITTED, ClaimStatus.CANCELLED],
      [ClaimStatus.APPROVED]: [ClaimStatus.SETTLED, ClaimStatus.CANCELLED],
      [ClaimStatus.PARTIALLY_APPROVED]: [ClaimStatus.SETTLED, ClaimStatus.CANCELLED],
      [ClaimStatus.REJECTED]: [],
      [ClaimStatus.SETTLED]: [],
      [ClaimStatus.CANCELLED]: [],
    };

    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot transition claim from "${current}" to "${next}"`,
      );
    }
  }

  /**
   * Validates that the status payload carries required fields for each transition.
   */
  private validateStatusPayload(dto: UpdateClaimStatusDto): void {
    if (
      (dto.status === ClaimStatus.APPROVED || dto.status === ClaimStatus.PARTIALLY_APPROVED) &&
      (dto.approvedAmount === undefined || dto.approvedAmount === null)
    ) {
      throw new BadRequestException(
        `approvedAmount is required when setting status to "${dto.status}"`,
      );
    }

    if (dto.approvedAmount !== undefined && dto.approvedAmount < 0) {
      throw new BadRequestException('approvedAmount cannot be negative');
    }

    if (dto.settledAmount !== undefined && dto.settledAmount < 0) {
      throw new BadRequestException('settledAmount cannot be negative');
    }

    if (
      dto.status === ClaimStatus.SETTLED &&
      (dto.settledAmount === undefined || dto.settledAmount === null)
    ) {
      throw new BadRequestException('settledAmount is required when setting status to "settled"');
    }

    if (dto.status === ClaimStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason is required when rejecting a claim');
    }

    if (dto.status === ClaimStatus.QUERY_RAISED && !dto.queryDetails) {
      throw new BadRequestException('queryDetails must be provided when raising a query');
    }
  }
}
