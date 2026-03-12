import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { MedicinePaginationDto } from './dto/medicine-pagination.dto';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PlanValidationGuard } from '../subscriptions/guards/plan-validation.guard';

@ApiTags('Pharmacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanValidationGuard)
@Controller('pharmacy')
export class PharmacyController {
    constructor(private readonly pharmacyService: PharmacyService) { }

    @Get('medicines')
    @ApiOperation({ summary: 'Get all medicines' })
    @Permissions('pharmacy:read')
    @Audit({ action: 'List Medicines', entityType: 'Medicine' })
    async findAll(@Query() query: MedicinePaginationDto) {
        return this.pharmacyService.findAll(query);
    }

    @Get('medicines/:id')
    @ApiOperation({ summary: 'Get medicine by ID' })
    @Permissions('pharmacy:read')
    @Audit({ action: 'View Medicine', entityType: 'Medicine' })
    async findOne(@Param('id') id: string) {
        return this.pharmacyService.findOne(id);
    }

    @Post('medicines')
    @ApiOperation({ summary: 'Create a new medicine' })
    @Permissions('pharmacy:create')
    @Audit({ action: 'Create Medicine', entityType: 'Medicine' })
    async create(@Body() createMedicineDto: CreateMedicineDto) {
        return this.pharmacyService.create(createMedicineDto);
    }

    @Post('medicines/:id/dispense')
    @ApiOperation({ summary: 'Dispense a medicine' })
    @Permissions('pharmacy:update')
    @Audit({ action: 'Dispense Medicine', entityType: 'Medicine' })
    async dispense(@Param('id') id: string, @Body('quantity') quantity: number) {
        return this.pharmacyService.dispense(id, quantity);
    }

    @Patch('medicines/:id')
    @ApiOperation({ summary: 'Update a medicine' })
    @Permissions('pharmacy:update')
    @Audit({ action: 'Update Medicine', entityType: 'Medicine' })
    async update(@Param('id') id: string, @Body() updateMedicineDto: UpdateMedicineDto) {
        return this.pharmacyService.update(id, updateMedicineDto);
    }

    @Delete('medicines/:id')
    @ApiOperation({ summary: 'Delete a medicine' })
    @Permissions('pharmacy:delete')
    @Audit({ action: 'Delete Medicine', entityType: 'Medicine' })
    async remove(@Param('id') id: string) {
        return this.pharmacyService.remove(id);
    }
}
