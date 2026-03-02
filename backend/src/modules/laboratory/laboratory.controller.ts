import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { LaboratoryService } from './laboratory.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateLabTestDto, UpdateLabTestDto } from './dto/create-lab-test.dto';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Laboratory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('laboratory')
export class LaboratoryController {
    constructor(private readonly laboratoryService: LaboratoryService) { }

    @Post('lab-tests')
    @ApiOperation({ summary: 'Create a new lab test' })
    @Permissions('laboratory:create')
    @Audit({ action: 'Create Lab Test', entityType: 'LabTest' })
    async create(@Body() createLabTestDto: CreateLabTestDto) {
        return this.laboratoryService.create(createLabTestDto);
    }

    @Get('lab-tests')
    @ApiOperation({ summary: 'Get all lab tests' })
    @Permissions('laboratory:read')
    @Audit({ action: 'List Lab Tests', entityType: 'LabTest' })
    async findAll(@Query() query: PaginationQueryDto) {
        return this.laboratoryService.findAll(query);
    }

    @Get('lab-tests/:id')
    @ApiOperation({ summary: 'Get lab test by ID' })
    @Permissions('laboratory:read')
    @Audit({ action: 'View Lab Test Details', entityType: 'LabTest' })
    async findOne(@Param('id') id: string) {
        return this.laboratoryService.findOne(id);
    }

    @Patch('lab-tests/:id')
    @ApiOperation({ summary: 'Update a lab test' })
    @Permissions('laboratory:update')
    @Audit({ action: 'Update Lab Test', entityType: 'LabTest' })
    async update(@Param('id') id: string, @Body() updateLabTestDto: UpdateLabTestDto) {
        return this.laboratoryService.update(id, updateLabTestDto);
    }

    @Delete('lab-tests/:id')
    @ApiOperation({ summary: 'Delete a lab test' })
    @Permissions('laboratory:delete')
    @Audit({ action: 'Delete Lab Test', entityType: 'LabTest' })
    async remove(@Param('id') id: string) {
        return this.laboratoryService.remove(id);
    }
}
