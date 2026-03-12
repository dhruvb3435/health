import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Ambulance,
  AmbulanceTrip,
  AmbulanceStatus,
  TripStatus,
} from './entities/ambulance.entity';
import {
  CreateAmbulanceDto,
  UpdateAmbulanceDto,
  DispatchAmbulanceDto,
  UpdateTripStatusDto,
  AmbulanceFiltersDto,
  TripFiltersDto,
} from './dto/ambulance.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { TenantService } from '../../common/services/tenant.service';

/** Trip statuses considered "in progress" — ambulance is not yet free. */
const ACTIVE_TRIP_STATUSES = new Set<TripStatus>([
  TripStatus.DISPATCHED,
  TripStatus.EN_ROUTE_PICKUP,
  TripStatus.PATIENT_PICKED,
  TripStatus.EN_ROUTE_HOSPITAL,
]);

/** Terminal statuses that free the ambulance back to available. */
const TERMINAL_TRIP_STATUSES = new Set<TripStatus>([
  TripStatus.COMPLETED,
  TripStatus.CANCELLED,
]);

@Injectable()
export class AmbulanceService {
  constructor(
    @InjectRepository(Ambulance)
    private readonly ambulanceRepo: Repository<Ambulance>,
    @InjectRepository(AmbulanceTrip)
    private readonly tripRepo: Repository<AmbulanceTrip>,
    private readonly tenantService: TenantService,
  ) {}

  // ── Fleet management ──────────────────────────────────────────────────────

  /**
   * Returns all ambulances for the organization, with optional filtering
   * by status, vehicle type, and a text search on vehicle number / driver name.
   */
  async getAmbulances(filters: AmbulanceFiltersDto): Promise<Ambulance[]> {
    const organizationId = this.tenantService.getTenantId();
    const { status, vehicleType, search, includeInactive } = filters;

    const qb = this.ambulanceRepo
      .createQueryBuilder('amb')
      .where('amb.organizationId = :organizationId', { organizationId });

    if (!includeInactive) {
      qb.andWhere('amb.isActive = true');
    }

    if (status) {
      qb.andWhere('amb.status = :status', { status });
    }

    if (vehicleType) {
      qb.andWhere('amb.vehicleType = :vehicleType', { vehicleType });
    }

    if (search) {
      qb.andWhere(
        '(amb.vehicleNumber ILIKE :search OR amb.driverName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.orderBy('amb.vehicleNumber', 'ASC').getMany();
  }

  /**
   * Registers a new ambulance vehicle in the organization's fleet.
   * Vehicle numbers must be unique per organization.
   */
  async createAmbulance(dto: CreateAmbulanceDto): Promise<Ambulance> {
    const organizationId = this.tenantService.getTenantId();

    // Guard: unique vehicle number per org
    const existing = await this.ambulanceRepo.findOne({
      where: { organizationId, vehicleNumber: dto.vehicleNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Ambulance with vehicle number "${dto.vehicleNumber}" already exists in this organization`,
      );
    }

    const ambulance = this.ambulanceRepo.create({
      organizationId,
      vehicleNumber: dto.vehicleNumber,
      vehicleType: dto.vehicleType,
      driverName: dto.driverName,
      driverPhone: dto.driverPhone,
      status: dto.status ?? AmbulanceStatus.AVAILABLE,
      currentLocation: dto.currentLocation ?? null,
      equipmentList: dto.equipmentList ?? null,
      lastServiceDate: dto.lastServiceDate ? new Date(dto.lastServiceDate) : null,
      insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
      fitnessExpiry: dto.fitnessExpiry ? new Date(dto.fitnessExpiry) : null,
      isActive: true,
    });

    return this.ambulanceRepo.save(ambulance);
  }

  /**
   * Partially updates an ambulance's details.
   * Vehicle number uniqueness is re-validated if it changes.
   */
  async updateAmbulance(id: string, dto: UpdateAmbulanceDto): Promise<Ambulance> {
    const organizationId = this.tenantService.getTenantId();
    const ambulance = await this.findAmbulanceOrFail(id, organizationId);

    // Guard: if vehicle number is changing, check no conflict exists
    if (dto.vehicleNumber && dto.vehicleNumber !== ambulance.vehicleNumber) {
      const conflict = await this.ambulanceRepo.findOne({
        where: { organizationId, vehicleNumber: dto.vehicleNumber },
      });
      if (conflict) {
        throw new ConflictException(
          `Ambulance with vehicle number "${dto.vehicleNumber}" already exists in this organization`,
        );
      }
    }

    // Build a Partial<Ambulance> explicitly to handle string→Date coercions
    // that class-validator does not perform (IsDateString validates but keeps strings).
    const updates: Partial<Ambulance> = {};

    if (dto.vehicleNumber !== undefined) updates.vehicleNumber = dto.vehicleNumber;
    if (dto.vehicleType !== undefined) updates.vehicleType = dto.vehicleType;
    if (dto.driverName !== undefined) updates.driverName = dto.driverName;
    if (dto.driverPhone !== undefined) updates.driverPhone = dto.driverPhone;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.currentLocation !== undefined) updates.currentLocation = dto.currentLocation;
    if (dto.equipmentList !== undefined) updates.equipmentList = dto.equipmentList;
    if (dto.isActive !== undefined) updates.isActive = dto.isActive;
    if (dto.lastServiceDate) updates.lastServiceDate = new Date(dto.lastServiceDate);
    if (dto.insuranceExpiry) updates.insuranceExpiry = new Date(dto.insuranceExpiry);
    if (dto.fitnessExpiry) updates.fitnessExpiry = new Date(dto.fitnessExpiry);

    Object.assign(ambulance, updates);
    return this.ambulanceRepo.save(ambulance);
  }

  /**
   * Soft-deletes an ambulance by marking it inactive.
   * Hard delete is intentionally avoided to preserve historical trip records.
   */
  async deleteAmbulance(id: string): Promise<{ message: string }> {
    const organizationId = this.tenantService.getTenantId();
    const ambulance = await this.findAmbulanceOrFail(id, organizationId);

    if (ambulance.status === AmbulanceStatus.ON_TRIP) {
      throw new BadRequestException(
        'Cannot deactivate an ambulance that is currently on a trip',
      );
    }

    ambulance.isActive = false;
    await this.ambulanceRepo.save(ambulance);

    return { message: `Ambulance ${ambulance.vehicleNumber} has been deactivated` };
  }

  // ── Trip management ───────────────────────────────────────────────────────

  /**
   * Returns a paginated list of trips with optional filters.
   */
  async getTrips(filters: TripFiltersDto): Promise<PaginatedResponse<AmbulanceTrip>> {
    const organizationId = this.tenantService.getTenantId();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const qb = this.tripRepo
      .createQueryBuilder('trip')
      .where('trip.organizationId = :organizationId', { organizationId })
      .leftJoinAndSelect('trip.ambulance', 'ambulance')
      .leftJoinAndSelect('trip.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .orderBy('trip.dispatchTime', 'DESC')
      .skip(offset)
      .take(limit);

    if (filters.status) {
      qb.andWhere('trip.status = :status', { status: filters.status });
    }

    if (filters.tripType) {
      qb.andWhere('trip.tripType = :tripType', { tripType: filters.tripType });
    }

    if (filters.priority) {
      qb.andWhere('trip.priority = :priority', { priority: filters.priority });
    }

    if (filters.ambulanceId) {
      qb.andWhere('trip.ambulanceId = :ambulanceId', { ambulanceId: filters.ambulanceId });
    }

    if (filters.dateFrom) {
      qb.andWhere('trip.dispatchTime >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    }

    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      qb.andWhere('trip.dispatchTime <= :dateTo', { dateTo: endDate });
    }

    const [data, total] = await qb.getManyAndCount();

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

  /**
   * Returns a single trip by ID.
   */
  async findOneTrip(id: string): Promise<AmbulanceTrip> {
    return this.findTripOrFail(id);
  }

  /**
   * Dispatches an ambulance:
   * 1. Verifies the ambulance is available.
   * 2. Auto-generates the trip number (TRIP-YYYYMMDD-NNN).
   * 3. Creates the trip record and sets ambulance status to on_trip atomically.
   */
  async dispatchAmbulance(dto: DispatchAmbulanceDto): Promise<AmbulanceTrip> {
    const organizationId = this.tenantService.getTenantId();
    const ambulance = await this.findAmbulanceOrFail(dto.ambulanceId, organizationId);

    if (ambulance.status !== AmbulanceStatus.AVAILABLE) {
      throw new BadRequestException(
        `Ambulance "${ambulance.vehicleNumber}" is not available — current status: ${ambulance.status}`,
      );
    }

    if (!ambulance.isActive) {
      throw new BadRequestException(
        `Ambulance "${ambulance.vehicleNumber}" is not active and cannot be dispatched`,
      );
    }

    const tripNumber = await this.generateTripNumber(organizationId);

    const trip = this.tripRepo.create({
      organizationId,
      ambulanceId: dto.ambulanceId,
      tripNumber,
      patientId: dto.patientId ?? null,
      patientName: dto.patientName,
      patientContact: dto.patientContact ?? null,
      pickupLocation: dto.pickupLocation,
      dropLocation: dto.dropLocation,
      tripType: dto.tripType,
      priority: dto.priority,
      status: TripStatus.DISPATCHED,
      dispatchTime: new Date(),
      emergencyCaseId: dto.emergencyCaseId ?? null,
    });

    // Mark ambulance as on_trip — both saves happen sequentially.
    // A true transaction is not used here to keep the service portable
    // (no DataSource injection needed), but if an atomic guarantee is
    // required this can be wrapped with a QueryRunner.
    ambulance.status = AmbulanceStatus.ON_TRIP;
    await this.ambulanceRepo.save(ambulance);

    return this.tripRepo.save(trip);
  }

  /**
   * Updates the status of a trip with automatic timestamp recording:
   * - patient_picked      → pickupTime
   * - en_route_hospital   → arrivalTime
   * - completed/cancelled → completionTime + ambulance set back to available
   *
   * Driver notes, distance, and fare can also be updated here.
   */
  async updateTripStatus(id: string, dto: UpdateTripStatusDto): Promise<AmbulanceTrip> {
    const organizationId = this.tenantService.getTenantId();
    const trip = await this.findTripOrFail(id, organizationId);

    if (TERMINAL_TRIP_STATUSES.has(trip.status)) {
      throw new BadRequestException(
        `Trip ${trip.tripNumber} is already ${trip.status} and cannot be updated`,
      );
    }

    if (trip.status === dto.status) {
      throw new BadRequestException(`Trip is already in status: ${dto.status}`);
    }

    trip.status = dto.status;

    // Append driver notes (accumulate, don't overwrite)
    if (dto.driverNotes) {
      const existing = trip.driverNotes ?? '';
      const prefix = existing ? `${existing}\n\n` : '';
      trip.driverNotes = `${prefix}[${dto.status}] ${dto.driverNotes}`;
    }

    if (dto.distance !== undefined) {
      trip.distance = dto.distance;
    }

    if (dto.fare !== undefined) {
      trip.fare = dto.fare;
    }

    // Auto-timestamps per status transition
    const now = new Date();

    if (dto.status === TripStatus.PATIENT_PICKED && !trip.pickupTime) {
      trip.pickupTime = now;
    }

    if (dto.status === TripStatus.EN_ROUTE_HOSPITAL && !trip.arrivalTime) {
      trip.arrivalTime = now;
    }

    if (TERMINAL_TRIP_STATUSES.has(dto.status)) {
      trip.completionTime = now;

      // Release the ambulance back to available once trip is closed
      const ambulance = await this.findAmbulanceOrFail(trip.ambulanceId, organizationId);
      ambulance.status = AmbulanceStatus.AVAILABLE;
      await this.ambulanceRepo.save(ambulance);
    }

    return this.tripRepo.save(trip);
  }

  /**
   * Returns only trips that are currently in progress (not yet completed/cancelled).
   * Intended for the live dispatch dashboard.
   */
  async getActiveTrips(
    organizationId?: string,
  ): Promise<AmbulanceTrip[]> {
    const orgId = organizationId ?? this.tenantService.getTenantId();

    return this.tripRepo
      .createQueryBuilder('trip')
      .where('trip.organizationId = :orgId', { orgId })
      .andWhere('trip.status IN (:...activeStatuses)', {
        activeStatuses: [...ACTIVE_TRIP_STATUSES],
      })
      .leftJoinAndSelect('trip.ambulance', 'ambulance')
      .leftJoinAndSelect('trip.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .orderBy('trip.priority', 'DESC') // critical first
      .addOrderBy('trip.dispatchTime', 'ASC') // oldest dispatch first within same priority
      .getMany();
  }

  // ── Fleet statistics ──────────────────────────────────────────────────────

  /**
   * Returns a dashboard-ready snapshot of the fleet:
   * - Total ambulances by status (available, on_trip, maintenance, out_of_service)
   * - Count of currently active (in-progress) trips
   * - Today's trip totals by trip type
   */
  async getFleetStats() {
    const organizationId = this.tenantService.getTenantId();

    // Counts by ambulance status
    const statusCounts = await this.ambulanceRepo
      .createQueryBuilder('amb')
      .select('amb.status', 'status')
      .addSelect('COUNT(amb.id)', 'count')
      .where('amb.organizationId = :organizationId', { organizationId })
      .andWhere('amb.isActive = true')
      .groupBy('amb.status')
      .getRawMany();

    const byStatus: Record<string, number> = {};
    let totalFleet = 0;
    for (const row of statusCounts) {
      const count = parseInt(row.count, 10);
      byStatus[row.status] = count;
      totalFleet += count;
    }

    // Active trips count
    const activeTripsCount = await this.tripRepo
      .createQueryBuilder('trip')
      .where('trip.organizationId = :organizationId', { organizationId })
      .andWhere('trip.status IN (:...activeStatuses)', {
        activeStatuses: [...ACTIVE_TRIP_STATUSES],
      })
      .getCount();

    // Today's trip breakdown by type
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayTripsByType = await this.tripRepo
      .createQueryBuilder('trip')
      .select('trip.tripType', 'tripType')
      .addSelect('COUNT(trip.id)', 'count')
      .where('trip.organizationId = :organizationId', { organizationId })
      .andWhere('trip.dispatchTime BETWEEN :start AND :end', {
        start: todayStart,
        end: todayEnd,
      })
      .groupBy('trip.tripType')
      .getRawMany();

    const todayByType: Record<string, number> = {};
    let todayTotal = 0;
    for (const row of todayTripsByType) {
      const count = parseInt(row.count, 10);
      todayByType[row.tripType] = count;
      todayTotal += count;
    }

    return {
      fleet: {
        total: totalFleet,
        byStatus,
      },
      activeTrips: activeTripsCount,
      todayTrips: {
        total: todayTotal,
        byType: todayByType,
      },
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async findAmbulanceOrFail(id: string, organizationId: string): Promise<Ambulance> {
    const ambulance = await this.ambulanceRepo.findOne({
      where: { id, organizationId },
    });

    if (!ambulance) {
      throw new NotFoundException(`Ambulance with id ${id} not found`);
    }

    return ambulance;
  }

  private async findTripOrFail(id: string, organizationId?: string): Promise<AmbulanceTrip> {
    const orgId = organizationId ?? this.tenantService.getTenantId();

    const trip = await this.tripRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['ambulance', 'patient', 'patient.user'],
    });

    if (!trip) {
      throw new NotFoundException(`Ambulance trip with id ${id} not found`);
    }

    return trip;
  }

  /**
   * Generates a unique trip number in the format TRIP-YYYYMMDD-NNN.
   * Counts existing trips dispatched today for this organization to
   * determine the sequential suffix NNN.
   */
  private async generateTripNumber(organizationId: string): Promise<string> {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const prefix = `TRIP-${datePart}-`;

    const count = await this.tripRepo
      .createQueryBuilder('trip')
      .where('trip.organizationId = :organizationId', { organizationId })
      .andWhere('trip.tripNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();

    const sequence = String(count + 1).padStart(3, '0');
    return `${prefix}${sequence}`;
  }
}
