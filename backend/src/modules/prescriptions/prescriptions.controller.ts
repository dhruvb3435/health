import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto/create-prescription.dto';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new prescription' })
  @Permissions('prescriptions:create')
  @Audit({ action: 'Create Prescription', entityType: 'Prescription' })
  async create(@Body() createPrescriptionDto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(createPrescriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all prescriptions' })
  @Permissions('prescriptions:read')
  @Audit({ action: 'List Prescriptions', entityType: 'Prescription' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.prescriptionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  @Permissions('prescriptions:read')
  @Audit({ action: 'View Prescription Details', entityType: 'Prescription' })
  async findOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prescription' })
  @Permissions('prescriptions:update')
  @Audit({ action: 'Update Prescription', entityType: 'Prescription' })
  async update(@Param('id') id: string, @Body() updatePrescriptionDto: UpdatePrescriptionDto) {
    return this.prescriptionsService.update(id, updatePrescriptionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prescription' })
  @Permissions('prescriptions:delete')
  @Audit({ action: 'Delete Prescription', entityType: 'Prescription' })
  async remove(@Param('id') id: string) {
    return this.prescriptionsService.remove(id);
  }
}
