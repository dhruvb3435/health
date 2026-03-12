import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { OperationTheaterService } from './operation-theater.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateSurgeryDto, UpdateSurgeryDto } from './dto/create-surgery.dto';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Operation Theater')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('operation-theater')
export class OperationTheaterController {
  constructor(private readonly theaterService: OperationTheaterService) { }

  @Post('surgeries')
  @ApiOperation({ summary: 'Schedule a new surgery' })
  @Permissions('surgery:create')
  @Audit({ action: 'Schedule Surgery', entityType: 'Surgery' })
  async createSurgery(@Body() createSurgeryDto: CreateSurgeryDto) {
    return this.theaterService.createSurgery(createSurgeryDto);
  }

  @Get('surgeries')
  @ApiOperation({ summary: 'Get all scheduled surgeries' })
  @Permissions('surgery:read')
  @Audit({ action: 'List Surgeries', entityType: 'Surgery' })
  async findAllSurgeries(@Query() query: PaginationQueryDto) {
    return this.theaterService.findAllSurgeries(query);
  }

  @Get('surgeries/:id')
  @ApiOperation({ summary: 'Get surgery by ID' })
  @Permissions('surgery:read')
  @Audit({ action: 'View Surgery', entityType: 'Surgery' })
  async findOneSurgery(@Param('id') id: string) {
    return this.theaterService.findOneSurgery(id);
  }

  @Patch('surgeries/:id')
  @ApiOperation({ summary: 'Update a surgery' })
  @Permissions('surgery:update')
  @Audit({ action: 'Update Surgery', entityType: 'Surgery' })
  async updateSurgery(@Param('id') id: string, @Body() updateSurgeryDto: UpdateSurgeryDto) {
    return this.theaterService.updateSurgery(id, updateSurgeryDto);
  }

  @Delete('surgeries/:id')
  @ApiOperation({ summary: 'Cancel/Delete a surgery' })
  @Permissions('surgery:delete')
  @Audit({ action: 'Cancel Surgery', entityType: 'Surgery' })
  async removeSurgery(@Param('id') id: string) {
    return this.theaterService.removeSurgery(id);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available theaters' })
  @Permissions('surgery:read')
  @Audit({ action: 'View Available Theaters', entityType: 'OperationTheater' })
  async getAvailableTheaters() {
    return this.theaterService.getAvailableTheaters();
  }
}
