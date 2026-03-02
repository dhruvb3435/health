import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Compliance & Audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('compliance')
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  @Get('records')
  async getComplianceRecords(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.complianceService.getComplianceRecords(skip, parseInt(limit));
  }

  @Get('non-compliant')
  async getNonCompliantItems() {
    return this.complianceService.getNonCompliantItems();
  }

  @Get('access-logs')
  async getAccessLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '100',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.complianceService.getAccessLogs(skip, parseInt(limit));
  }

  @Get('access-logs/user')
  async getAccessLogsByUser(@Query('userId') userId: string) {
    return this.complianceService.getAccessLogsByUser(userId);
  }
}
