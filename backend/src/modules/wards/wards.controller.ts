import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { WardsService } from './wards.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateWardDto, UpdateWardDto } from './dto/create-ward.dto';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Wards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('wards')
export class WardsController {
  constructor(private readonly wardsService: WardsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new ward' })
  @Permissions('wards:create')
  @Audit({ action: 'Create Ward', entityType: 'Ward' })
  async create(@Body() createWardDto: CreateWardDto) {
    return this.wardsService.create(createWardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wards' })
  @Permissions('wards:read')
  @Audit({ action: 'List Wards', entityType: 'Ward' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.wardsService.findAll(query);
  }

  @Get('available-beds')
  @ApiOperation({ summary: 'Get all available beds' })
  @Permissions('wards:read')
  @Audit({ action: 'View Available Beds', entityType: 'Ward' })
  async getAvailableBeds() {
    return this.wardsService.getAvailableBeds();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ward statistics' })
  @Permissions('wards:read')
  @Audit({ action: 'View Ward Stats', entityType: 'Ward' })
  async getStats() {
    return this.wardsService.getWardStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ward by ID' })
  @Permissions('wards:read')
  @Audit({ action: 'View Ward Details', entityType: 'Ward' })
  async findOne(@Param('id') id: string) {
    return this.wardsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ward' })
  @Permissions('wards:update')
  @Audit({ action: 'Update Ward', entityType: 'Ward' })
  async update(@Param('id') id: string, @Body() updateWardDto: UpdateWardDto) {
    return this.wardsService.update(id, updateWardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ward' })
  @Permissions('wards:delete')
  @Audit({ action: 'Delete Ward', entityType: 'Ward' })
  async remove(@Param('id') id: string) {
    return this.wardsService.remove(id);
  }
}
