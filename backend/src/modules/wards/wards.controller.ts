import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { WardsService } from './wards.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateWardDto, UpdateWardDto } from './dto/create-ward.dto';

@ApiTags('Wards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wards')
export class WardsController {
  constructor(private readonly wardsService: WardsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new ward' })
  async create(@Body() createWardDto: CreateWardDto) {
    return this.wardsService.create(createWardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wards' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.wardsService.findAll(query);
  }

  @Get('available-beds')
  @ApiOperation({ summary: 'Get all available beds' })
  async getAvailableBeds() {
    return this.wardsService.getAvailableBeds();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ward statistics' })
  async getStats() {
    return this.wardsService.getWardStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ward by ID' })
  async findOne(@Param('id') id: string) {
    return this.wardsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ward' })
  async update(@Param('id') id: string, @Body() updateWardDto: UpdateWardDto) {
    return this.wardsService.update(id, updateWardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ward' })
  async remove(@Param('id') id: string) {
    return this.wardsService.remove(id);
  }
}
