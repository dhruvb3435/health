import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity' })
  async getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  async getRevenueAnalytics() {
    return this.dashboardService.getRevenueTrend();
  }

  @Get('analytics/volume')
  @ApiOperation({ summary: 'Get patient volume analytics' })
  async getPatientVolumeAnalytics() {
    return this.dashboardService.getPatientVolume();
  }
}
