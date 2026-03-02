import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { StaffRole } from './entities/staff.entity';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new staff member' })
  @Audit({ action: 'Create Staff', entityType: 'Staff' })
  async create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff' })
  @Audit({ action: 'List Staff', entityType: 'Staff' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.staffService.findAll(query);
  }

  @Get('by-role')
  @ApiOperation({ summary: 'Get staff by role' })
  @Audit({ action: 'List Staff By Role', entityType: 'Staff' })
  async getStaffByRole(@Query('role') role: string) {
    return this.staffService.getStaffByRole(role as StaffRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff member by ID' })
  @Audit({ action: 'View Staff', entityType: 'Staff' })
  async findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff member' })
  @Audit({ action: 'Update Staff', entityType: 'Staff' })
  async update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a staff member' })
  @Audit({ action: 'Delete Staff', entityType: 'Staff' })
  async remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}
