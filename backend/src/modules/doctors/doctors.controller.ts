import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/create-doctor.dto';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PlanValidationGuard } from '../subscriptions/guards/plan-validation.guard';
import { RequireFeatureLimit } from '../subscriptions/decorators/feature-limit.decorator';

@ApiTags('Doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanValidationGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new doctor' })
  @Permissions('doctors:create')
  @RequireFeatureLimit('MAX_DOCTORS')
  @Audit({ action: 'Create Doctor', entityType: 'Doctor' })
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorsService.create(createDoctorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all doctors' })
  @Permissions('doctors:read')
  @Audit({ action: 'List Doctors', entityType: 'Doctor' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.doctorsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID' })
  @Permissions('doctors:read')
  @Audit({ action: 'View Doctor Details', entityType: 'Doctor' })
  async findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a doctor' })
  @Permissions('doctors:update')
  @Audit({ action: 'Update Doctor', entityType: 'Doctor' })
  async update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a doctor' })
  @Permissions('doctors:delete')
  @Audit({ action: 'Delete Doctor', entityType: 'Doctor' })
  async remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }
}
