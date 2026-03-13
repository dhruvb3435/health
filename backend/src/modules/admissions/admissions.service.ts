import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Admission, AdmissionStatus } from './entities/admission.entity';
import { Ward, Bed, BedStatus } from '../wards/entities/ward.entity';
import { CreateAdmissionDto, UpdateVitalsDto, AddNursingNoteDto, DischargeAdmissionDto } from './dto/create-admission.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class AdmissionsService {
    constructor(
        @InjectRepository(Admission)
        private readonly admissionRepo: Repository<Admission>,
        @InjectRepository(Ward)
        private readonly wardRepo: Repository<Ward>,
        @InjectRepository(Bed)
        private readonly bedRepo: Repository<Bed>,
        private readonly tenantService: TenantService,
        private readonly dataSource: DataSource,
    ) { }

    async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Admission>> {
        const { page = 1, limit = 20, search } = query;
        const skip = (page - 1) * limit;
        const organizationId = this.tenantService.getTenantId();

        const where = search
            ? [
                { admissionId: Like(`%${search}%`), organizationId },
                { reason: Like(`%${search}%`), organizationId },
                { diagnosis: Like(`%${search}%`), organizationId },
            ]
            : { organizationId };

        const [data, total] = await this.admissionRepo.findAndCount({
            where,
            relations: ['patient', 'doctor', 'ward', 'bed'],
            order: { admissionDate: 'DESC' },
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
        const admission = await this.admissionRepo.findOne({
            where: { id, organizationId },
            relations: ['patient', 'doctor', 'ward', 'bed'],
        });

        if (!admission) {
            throw new NotFoundException(`Admission with ID ${id} not found`);
        }

        return admission;
    }

    async create(createAdmissionDto: CreateAdmissionDto) {
        const { bedId, wardId } = createAdmissionDto;
        const organizationId = this.tenantService.getTenantId();

        // Validate admission date is not in the future
        const admissionDate = new Date(createAdmissionDto.admissionDate);
        if (admissionDate > new Date()) {
            throw new BadRequestException('Admission date cannot be in the future');
        }

        // Run admission + bed/ward updates in a transaction to prevent inconsistent state
        return await this.dataSource.transaction(async (manager) => {
            // Check ward capacity (filter by org to prevent cross-tenant access)
            const ward = await manager.findOne(Ward, { where: { id: wardId, organizationId } });
            if (!ward) throw new NotFoundException('Ward not found');
            if (ward.occupiedBeds >= ward.totalBeds) {
                throw new BadRequestException(
                    `Ward "${ward.wardName}" is at full capacity (${ward.occupiedBeds}/${ward.totalBeds} beds occupied)`,
                );
            }

            // Check bed availability (filter by org)
            const bed = await manager.findOne(Bed, { where: { id: bedId, organizationId } });
            if (!bed) throw new NotFoundException('Bed not found');
            if (bed.status !== BedStatus.AVAILABLE) {
                throw new BadRequestException('Bed is not available');
            }

            // Create admission
            const admission = manager.create(Admission, {
                ...createAdmissionDto,
                admissionDate,
                organizationId,
            });
            const savedAdmission = await manager.save(admission);

            // Update bed status
            bed.status = BedStatus.OCCUPIED;
            bed.assignedPatientId = createAdmissionDto.patientId;
            bed.assignedDate = new Date();
            await manager.save(bed);

            // Update ward occupancy
            ward.occupiedBeds += 1;
            await manager.save(ward);

            return savedAdmission;
        });
    }

    async updateVitals(id: string, updateVitalsDto: UpdateVitalsDto) {
        const admission = await this.findOne(id);

        admission.vitalsHistory.push({
            ...updateVitalsDto,
            timestamp: new Date(),
        });

        return this.admissionRepo.save(admission);
    }

    async addNursingNote(id: string, addNursingNoteDto: AddNursingNoteDto) {
        const admission = await this.findOne(id);

        admission.nursingNotes.push({
            ...addNursingNoteDto,
            timestamp: new Date(),
        });

        return this.admissionRepo.save(admission);
    }

    async discharge(id: string, dischargeDto: DischargeAdmissionDto) {
        const admission = await this.findOne(id);
        if (admission.status === AdmissionStatus.DISCHARGED) {
            throw new BadRequestException('Patient already discharged');
        }

        const organizationId = this.tenantService.getTenantId();

        // Run discharge + bed/ward updates in a transaction
        return await this.dataSource.transaction(async (manager) => {
            // Update admission record
            admission.status = AdmissionStatus.DISCHARGED;
            admission.dischargeDate = new Date(dischargeDto.dischargeDate);
            admission.dischargeSummary = dischargeDto.dischargeSummary;
            admission.dischargePlan = dischargeDto.dischargePlan;
            await manager.save(admission);

            // Free the bed
            const bed = await manager.findOne(Bed, { where: { id: admission.bedId, organizationId } });
            if (bed) {
                bed.status = BedStatus.AVAILABLE;
                bed.assignedPatientId = null;
                bed.assignedDate = null;
                await manager.save(bed);
            }

            // Update ward occupancy
            const ward = await manager.findOne(Ward, { where: { id: admission.wardId, organizationId } });
            if (ward) {
                ward.occupiedBeds = Math.max(0, ward.occupiedBeds - 1);
                await manager.save(ward);
            }

            return admission;
        });
    }

    async getBillingInfo(id: string) {
        const admission = await this.findOne(id);
        const now = admission.dischargeDate || new Date();
        const admissionDate = new Date(admission.admissionDate);

        // Calculate days (minimum 1 day)
        const diffTime = Math.abs(now.getTime() - admissionDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        const wardPrice = admission.ward?.pricePerDay || 0;
        const estimatedStayCharges = diffDays * Number(wardPrice);

        return {
            admissionId: admission.admissionId,
            stayDuration: diffDays,
            wardRate: wardPrice,
            estimatedStayCharges,
            admissionDate: admission.admissionDate,
            dischargeDate: admission.dischargeDate,
            status: admission.status,
            patient: admission.patient,
        };
    }
}
