import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicine } from './entities/medicine.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class PharmacyService {
    constructor(
        @InjectRepository(Medicine)
        private readonly medicineRepo: Repository<Medicine>,
        private readonly tenantService: TenantService,
    ) { }

    async findAll(query: PaginationQueryDto & { formulation?: string; stockFilter?: string }): Promise<PaginatedResponse<Medicine>> {
        const { page = 1, limit = 20, search = '', formulation, stockFilter } = query;
        const skip = (page - 1) * limit;
        const organizationId = this.tenantService.getTenantId();

        const qb = this.medicineRepo.createQueryBuilder('medicine')
            .where('medicine.organizationId = :organizationId', { organizationId });

        if (search) {
            qb.andWhere('medicine.name ILIKE :search', { search: `%${search}%` });
        }
        if (formulation) {
            qb.andWhere('medicine.formulation = :formulation', { formulation });
        }
        if (stockFilter === 'low') {
            qb.andWhere('medicine.stock <= medicine.reorderLevel');
        } else if (stockFilter === 'out') {
            qb.andWhere('medicine.stock = 0');
        }

        qb.orderBy('medicine.name', 'ASC').skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();

        const now = new Date();
        const enrichedData = data.map((medicine) => ({
            ...medicine,
            isExpired: medicine.expiryDate ? new Date(medicine.expiryDate) < now : false,
        }));

        return {
            data: enrichedData as any,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async dispense(id: string, quantity: number): Promise<Medicine> {
        const medicine = await this.findOne(id);

        if (medicine.expiryDate && new Date(medicine.expiryDate) < new Date()) {
            throw new BadRequestException(
                `Cannot dispense medicine "${medicine.name}" — it expired on ${medicine.expiryDate}`,
            );
        }

        if (medicine.stock < quantity) {
            throw new BadRequestException(
                `Insufficient stock for "${medicine.name}". Available: ${medicine.stock}, requested: ${quantity}`,
            );
        }

        medicine.stock -= quantity;
        return this.medicineRepo.save(medicine);
    }

    async findOne(id: string): Promise<Medicine> {
        const organizationId = this.tenantService.getTenantId();
        const medicine = await this.medicineRepo.findOne({ where: { id, organizationId } });
        if (!medicine) {
            throw new NotFoundException(`Medicine with ID ${id} not found`);
        }
        return medicine;
    }

    async create(createMedicineDto: CreateMedicineDto): Promise<Medicine> {
        const organizationId = this.tenantService.getTenantId();
        const medicine = this.medicineRepo.create({
            ...createMedicineDto,
            organizationId,
        });
        return this.medicineRepo.save(medicine);
    }

    async update(id: string, updateMedicineDto: UpdateMedicineDto): Promise<Medicine> {
        const medicine = await this.findOne(id);
        Object.assign(medicine, updateMedicineDto);
        return this.medicineRepo.save(medicine);
    }

    async remove(id: string): Promise<void> {
        const medicine = await this.findOne(id);
        await this.medicineRepo.softRemove(medicine);
    }
}
