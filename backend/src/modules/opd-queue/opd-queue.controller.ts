import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OpdQueueService } from './opd-queue.service';
import { CreateOpdQueueDto, UpdateQueueStatusDto } from './dto/create-opd-queue.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('OPD Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('opd-queue')
export class OpdQueueController {
  constructor(private readonly opdQueueService: OpdQueueService) {}

  @Get()
  @ApiOperation({ summary: 'Get today\'s OPD queue' })
  @Permissions('opd-queue:read')
  async getTodayQueue(@Query('doctorId') doctorId?: string) {
    return this.opdQueueService.getTodayQueue(doctorId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics for today' })
  @Permissions('opd-queue:read')
  async getStats() {
    return this.opdQueueService.getQueueStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get queue entry by ID' })
  @Permissions('opd-queue:read')
  async findOne(@Param('id') id: string) {
    return this.opdQueueService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Check-in a patient to the queue' })
  @Permissions('opd-queue:create')
  @Audit({ action: 'Patient Check-in', entityType: 'OpdQueue' })
  async checkin(@Body() dto: CreateOpdQueueDto) {
    return this.opdQueueService.checkinPatient(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update queue entry status (call patient, complete, etc.)' })
  @Permissions('opd-queue:update')
  @Audit({ action: 'Update Queue Status', entityType: 'OpdQueue' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateQueueStatusDto) {
    return this.opdQueueService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove queue entry' })
  @Permissions('opd-queue:delete')
  @Audit({ action: 'Remove from Queue', entityType: 'OpdQueue' })
  async remove(@Param('id') id: string) {
    return this.opdQueueService.remove(id);
  }
}
