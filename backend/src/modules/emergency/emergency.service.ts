import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  EmergencyCase,
  EmergencyStatus,
  TriageLevel,
} from './entities/emergency.entity';
import {
  RegisterEmergencyDto,
  TriageDto,
  UpdateEmergencyCaseDto,
  UpdateEmergencyStatusDto,
  EmergencyCaseFiltersDto,
  EmergencyCaseHistoryFiltersDto,
} from './dto/emergency.dto';
import { TenantService } from '../../common/services/tenant.service';

/**
 * Triage levels ordered by clinical priority (most critical first).
 * Used for ORDER BY in active-case queries.
 */
const TRIAGE_PRIORITY_ORDER: Record<TriageLevel, number> = {
  [TriageLevel.LEVEL_1_RESUSCITATION]: 1,
  [TriageLevel.LEVEL_2_EMERGENCY]: 2,
  [TriageLevel.LEVEL_3_URGENT]: 3,
  [TriageLevel.LEVEL_4_SEMI_URGENT]: 4,
  [TriageLevel.LEVEL_5_NON_URGENT]: 5,
};

/** Statuses that are considered terminal / disposition-complete */
const DISPOSITION_STATUSES = new Set<EmergencyStatus>([
  EmergencyStatus.DISCHARGED,
  EmergencyStatus.TRANSFERRED,
  EmergencyStatus.ADMITTED,
  EmergencyStatus.DECEASED,
]);

@Injectable()
export class EmergencyService {
  constructor(
    @InjectRepository(EmergencyCase)
    private readonly emergencyRepo: Repository<EmergencyCase>,
    private readonly tenantService: TenantService,
  ) {}

  // ── Active cases ──────────────────────────────────────────────────────────

  /**
   * Returns all active emergency cases for the organization, ordered by
   * triage level (most critical first) then arrival time (longest wait first).
   */
  async getActiveCases(filters: EmergencyCaseFiltersDto) {
    const organizationId = this.tenantService.getTenantId();

    const qb = this.emergencyRepo
      .createQueryBuilder('ec')
      .where('ec.organizationId = :organizationId', { organizationId })
      .andWhere('ec.isActive = true')
      .leftJoinAndSelect('ec.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .leftJoinAndSelect('ec.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      // Active = not yet fully disposed
      .andWhere('ec.status NOT IN (:...dispositionStatuses)', {
        dispositionStatuses: [
          EmergencyStatus.DISCHARGED,
          EmergencyStatus.TRANSFERRED,
          EmergencyStatus.DECEASED,
        ],
      })
      .orderBy('ec.triageLevel', 'ASC') // level_1 sorts before level_5
      .addOrderBy('ec.arrivalTime', 'ASC'); // longest-waiting first within same level

    if (filters.status) {
      qb.andWhere('ec.status = :status', { status: filters.status });
    }

    if (filters.triageLevel) {
      qb.andWhere('ec.triageLevel = :triageLevel', { triageLevel: filters.triageLevel });
    }

    if (filters.arrivalMode) {
      qb.andWhere('ec.arrivalMode = :arrivalMode', { arrivalMode: filters.arrivalMode });
    }

    if (filters.doctorId) {
      qb.andWhere('ec.doctorId = :doctorId', { doctorId: filters.doctorId });
    }

    const cases = await qb.getMany();

    // Build per-level summary for the response
    const byLevel: Record<string, number> = {};
    for (const c of cases) {
      const key = c.triageLevel ?? 'untriaged';
      byLevel[key] = (byLevel[key] || 0) + 1;
    }

    return {
      data: cases,
      summary: {
        total: cases.length,
        byTriageLevel: byLevel,
      },
    };
  }

  // ── Registration ──────────────────────────────────────────────────────────

  /**
   * Registers a new emergency case. The case number is auto-generated in the
   * format EMR-YYYYMMDD-NNN where NNN is the sequential counter for today.
   */
  async registerCase(dto: RegisterEmergencyDto): Promise<EmergencyCase> {
    const organizationId = this.tenantService.getTenantId();

    const caseNumber = await this.generateCaseNumber(organizationId);

    const emergencyCase = this.emergencyRepo.create({
      organizationId,
      caseNumber,
      chiefComplaint: dto.chiefComplaint,
      arrivalMode: dto.arrivalMode,
      patientId: dto.patientId ?? null,
      triageLevel: dto.triageLevel ?? null,
      vitals: dto.vitals ?? null,
      injuryType: dto.injuryType ?? null,
      allergies: dto.allergies ?? null,
      arrivalTime: new Date(),
      status: EmergencyStatus.REGISTERED,
      isActive: true,
    });

    // If triageLevel was provided at registration, record triageTime immediately
    if (dto.triageLevel) {
      emergencyCase.triageTime = new Date();
      emergencyCase.status = EmergencyStatus.TRIAGED;
    }

    return this.emergencyRepo.save(emergencyCase);
  }

  // ── Triage ────────────────────────────────────────────────────────────────

  /**
   * Assigns triage level, vitals, and optionally a doctor to a registered case.
   * Sets triageTime and transitions status to TRIAGED.
   */
  async triageCase(id: string, dto: TriageDto): Promise<EmergencyCase> {
    const emergencyCase = await this.findOneOrFail(id);

    if (emergencyCase.status === EmergencyStatus.DECEASED) {
      throw new BadRequestException('Cannot triage a case marked as deceased');
    }

    emergencyCase.triageLevel = dto.triageLevel;
    emergencyCase.vitals = dto.vitals as any;
    emergencyCase.triageTime = emergencyCase.triageTime ?? new Date();
    emergencyCase.status = EmergencyStatus.TRIAGED;

    if (dto.doctorId) {
      emergencyCase.doctorId = dto.doctorId;
    }

    if (dto.notes) {
      // Append triage notes to existing treatment notes
      const existing = emergencyCase.treatmentNotes ?? '';
      const prefix = existing ? `${existing}\n\n` : '';
      emergencyCase.treatmentNotes = `${prefix}[Triage] ${dto.notes}`;
    }

    return this.emergencyRepo.save(emergencyCase);
  }

  // ── Status update ─────────────────────────────────────────────────────────

  /**
   * Updates the status of an emergency case with appropriate automatic timestamps:
   * - in_treatment  → sets treatmentStartTime (once, on first transition)
   * - discharged / transferred / admitted / deceased → sets dispositionTime
   */
  async updateStatus(id: string, dto: UpdateEmergencyStatusDto): Promise<EmergencyCase> {
    const emergencyCase = await this.findOneOrFail(id);

    if (emergencyCase.status === dto.status) {
      throw new BadRequestException(`Case is already in status: ${dto.status}`);
    }

    // Guard: cannot transition out of terminal states
    if (DISPOSITION_STATUSES.has(emergencyCase.status)) {
      throw new BadRequestException(
        `Cannot change status of a case that has already been ${emergencyCase.status}`,
      );
    }

    emergencyCase.status = dto.status;

    if (dto.treatmentNotes) {
      const existing = emergencyCase.treatmentNotes ?? '';
      const prefix = existing ? `${existing}\n\n` : '';
      emergencyCase.treatmentNotes = `${prefix}${dto.treatmentNotes}`;
    }

    if (dto.disposition) {
      emergencyCase.disposition = dto.disposition;
    }

    if (dto.admissionId) {
      emergencyCase.admissionId = dto.admissionId;
    }

    if (dto.doctorId) {
      emergencyCase.doctorId = dto.doctorId;
    }

    // Auto-timestamp: treatment start
    if (dto.status === EmergencyStatus.IN_TREATMENT && !emergencyCase.treatmentStartTime) {
      emergencyCase.treatmentStartTime = new Date();
    }

    // Auto-timestamp: disposition (case closed)
    if (DISPOSITION_STATUSES.has(dto.status)) {
      emergencyCase.dispositionTime = new Date();
      emergencyCase.isActive = false;
    }

    return this.emergencyRepo.save(emergencyCase);
  }

  // ── General update ────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateEmergencyCaseDto): Promise<EmergencyCase> {
    const emergencyCase = await this.findOneOrFail(id);
    Object.assign(emergencyCase, dto);
    return this.emergencyRepo.save(emergencyCase);
  }

  // ── Single record ─────────────────────────────────────────────────────────

  async findOne(id: string): Promise<EmergencyCase> {
    return this.findOneOrFail(id);
  }

  // ── Statistics ────────────────────────────────────────────────────────────

  /**
   * Returns a dashboard-ready stats snapshot for the ED:
   * - Active cases broken down by triage level
   * - Average triage wait time (arrival → triage) in minutes
   * - Average treatment wait time (triage → treatment start) in minutes
   * - Total cases registered today
   */
  async getStats() {
    const organizationId = this.tenantService.getTenantId();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Active cases by triage level
    const activeCasesByLevel = await this.emergencyRepo
      .createQueryBuilder('ec')
      .select('ec.triageLevel', 'triageLevel')
      .addSelect('COUNT(ec.id)', 'count')
      .where('ec.organizationId = :organizationId', { organizationId })
      .andWhere('ec.isActive = true')
      .groupBy('ec.triageLevel')
      .getRawMany();

    const byLevel: Record<string, number> = {};
    let activeTotal = 0;
    activeCasesByLevel.forEach(row => {
      const key = row.triageLevel ?? 'untriaged';
      const count = parseInt(row.count, 10);
      byLevel[key] = count;
      activeTotal += count;
    });

    // Average wait from arrival → triage (in minutes)
    const avgTriageWait = await this.emergencyRepo
      .createQueryBuilder('ec')
      .select(
        'AVG(EXTRACT(EPOCH FROM (ec.triageTime - ec.arrivalTime)))',
        'avgWaitSeconds',
      )
      .where('ec.organizationId = :organizationId', { organizationId })
      .andWhere('ec.triageTime IS NOT NULL')
      .andWhere('ec.arrivalTime IS NOT NULL')
      .getRawOne();

    // Average wait from triage → treatment start (in minutes)
    const avgTreatmentWait = await this.emergencyRepo
      .createQueryBuilder('ec')
      .select(
        'AVG(EXTRACT(EPOCH FROM (ec.treatmentStartTime - ec.triageTime)))',
        'avgWaitSeconds',
      )
      .where('ec.organizationId = :organizationId', { organizationId })
      .andWhere('ec.treatmentStartTime IS NOT NULL')
      .andWhere('ec.triageTime IS NOT NULL')
      .getRawOne();

    // Today's case count
    const casesToday = await this.emergencyRepo.count({
      where: {
        organizationId,
        arrivalTime: Between(todayStart, todayEnd),
      },
    });

    // Today's disposition breakdown
    const dispositionBreakdown = await this.emergencyRepo
      .createQueryBuilder('ec')
      .select('ec.status', 'status')
      .addSelect('COUNT(ec.id)', 'count')
      .where('ec.organizationId = :organizationId', { organizationId })
      .andWhere('ec.arrivalTime BETWEEN :start AND :end', {
        start: todayStart,
        end: todayEnd,
      })
      .groupBy('ec.status')
      .getRawMany();

    const todayByStatus: Record<string, number> = {};
    dispositionBreakdown.forEach(row => {
      todayByStatus[row.status] = parseInt(row.count, 10);
    });

    return {
      activeCases: {
        total: activeTotal,
        byTriageLevel: byLevel,
      },
      todayCases: {
        total: casesToday,
        byStatus: todayByStatus,
      },
      averageWaitTimes: {
        triageWaitMinutes: avgTriageWait?.avgWaitSeconds
          ? Math.round(parseFloat(avgTriageWait.avgWaitSeconds) / 60)
          : 0,
        treatmentWaitMinutes: avgTreatmentWait?.avgWaitSeconds
          ? Math.round(parseFloat(avgTreatmentWait.avgWaitSeconds) / 60)
          : 0,
      },
    };
  }

  // ── Case history ──────────────────────────────────────────────────────────

  /**
   * Returns paginated case history for audit, reporting, and retrospective review.
   */
  async getCaseHistory(filters: EmergencyCaseHistoryFiltersDto) {
    const organizationId = this.tenantService.getTenantId();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const qb = this.emergencyRepo
      .createQueryBuilder('ec')
      .where('ec.organizationId = :organizationId', { organizationId })
      .leftJoinAndSelect('ec.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .leftJoinAndSelect('ec.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .orderBy('ec.arrivalTime', 'DESC')
      .skip(offset)
      .take(limit);

    if (filters.status) {
      qb.andWhere('ec.status = :status', { status: filters.status });
    }

    if (filters.triageLevel) {
      qb.andWhere('ec.triageLevel = :triageLevel', { triageLevel: filters.triageLevel });
    }

    if (filters.arrivalMode) {
      qb.andWhere('ec.arrivalMode = :arrivalMode', { arrivalMode: filters.arrivalMode });
    }

    if (filters.doctorId) {
      qb.andWhere('ec.doctorId = :doctorId', { doctorId: filters.doctorId });
    }

    if (filters.dateFrom) {
      qb.andWhere('ec.arrivalTime >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    }

    if (filters.dateTo) {
      // Include the full end day
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      qb.andWhere('ec.arrivalTime <= :dateTo', { dateTo: endDate });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findOneOrFail(id: string): Promise<EmergencyCase> {
    const organizationId = this.tenantService.getTenantId();
    const emergencyCase = await this.emergencyRepo.findOne({
      where: { id, organizationId },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
    });

    if (!emergencyCase) {
      throw new NotFoundException(`Emergency case with id ${id} not found`);
    }

    return emergencyCase;
  }

  /**
   * Generates a unique case number in the format EMR-YYYYMMDD-NNN.
   * Counts existing cases for today within this organization to determine NNN.
   * Uses a subquery-based approach without a DB sequence for portability.
   */
  private async generateCaseNumber(organizationId: string): Promise<string> {
    const now = new Date();
    const datePart = now
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, ''); // YYYYMMDD

    // Count cases already registered today for this organization
    const prefix = `EMR-${datePart}-`;
    const count = await this.emergencyRepo
      .createQueryBuilder('ec')
      .where('ec.organizationId = :organizationId', { organizationId })
      .andWhere('ec.caseNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();

    const sequence = String(count + 1).padStart(3, '0');
    return `${prefix}${sequence}`;
  }
}
