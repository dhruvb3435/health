import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RadiologyService } from './radiology.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Radiology')
@ApiTags('Radiology')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
@Controller('radiology')
export class RadiologyController {
  constructor(private radiologyService: RadiologyService) { }

  @Get('requests')
  @ApiOperation({ summary: 'Get all radiology requests' })
  @Permissions('radiology:read')
  @Audit({ action: 'List Radiology Requests', entityType: 'Radiology' })
  async getRadiologyRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.radiologyService.getRadiologyRequests(skip, parseInt(limit));
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending radiology reports' })
  @Permissions('radiology:read')
  @Audit({ action: 'List Pending Radiology', entityType: 'Radiology' })
  async getPendingReports() {
    return this.radiologyService.getPendingReports();
  }

  @Get('completed')
  @ApiOperation({ summary: 'Get completed radiology reports' })
  @Permissions('radiology:read')
  @Audit({ action: 'List Completed Radiology', entityType: 'Radiology' })
  async getCompletedReports() {
    return this.radiologyService.getCompletedReports();
  }
}
