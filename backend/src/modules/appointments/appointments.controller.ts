import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentPaginationDto } from './dto/appointment-pagination.dto';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/create-appointment.dto';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PlanValidationGuard } from '../subscriptions/guards/plan-validation.guard';
import { RequireFeatureLimit } from '../subscriptions/decorators/feature-limit.decorator';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanValidationGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @Permissions('appointments:create')
  @RequireFeatureLimit('MAX_APPOINTMENTS')
  @Audit({ action: 'Create Appointment', entityType: 'Appointment' })
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  @Permissions('appointments:read')
  @Audit({ action: 'List Appointments', entityType: 'Appointment' })
  async findAll(@Query() query: AppointmentPaginationDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @Permissions('appointments:read')
  @Audit({ action: 'View Appointment Details', entityType: 'Appointment' })
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @Permissions('appointments:update')
  @Audit({ action: 'Update Appointment', entityType: 'Appointment' })
  async update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @Permissions('appointments:delete')
  @Audit({ action: 'Delete Appointment', entityType: 'Appointment' })
  async remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
