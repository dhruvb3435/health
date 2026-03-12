import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { OrganizationId } from '../../common/decorators/organization-id.decorator';
import { DischargeSummaryService } from './discharge-summary.service';
import { CreateDischargeSummaryDto, UpdateDischargeSummaryDto, UpdateDischargeStatusDto } from './dto/discharge-summary.dto';

@ApiTags('Discharge Summary')
@ApiBearerAuth()
@Controller('discharge-summaries')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DischargeSummaryController {
    constructor(private readonly service: DischargeSummaryService) {}

    @Get()
    @Permissions('discharge-summary:read')
    async findAll(
        @OrganizationId() organizationId: string,
        @Query() query: { status?: string; page?: string; limit?: string },
    ) {
        return this.service.findAll(organizationId, {
            status: query.status,
            page: query.page ? parseInt(query.page) : undefined,
            limit: query.limit ? parseInt(query.limit) : undefined,
        });
    }

    @Get('stats')
    @Permissions('discharge-summary:read')
    async getStats(@OrganizationId() organizationId: string) {
        return this.service.getStats(organizationId);
    }

    @Get(':id')
    @Permissions('discharge-summary:read')
    async findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
        return this.service.findOne(id, organizationId);
    }

    @Post()
    @Permissions('discharge-summary:create')
    @Audit()
    async create(@OrganizationId() organizationId: string, @Body() dto: CreateDischargeSummaryDto) {
        return this.service.create(organizationId, dto);
    }

    @Patch(':id')
    @Permissions('discharge-summary:update')
    @Audit()
    async update(
        @Param('id') id: string,
        @OrganizationId() organizationId: string,
        @Body() dto: UpdateDischargeSummaryDto,
    ) {
        return this.service.update(id, organizationId, dto);
    }

    @Patch(':id/status')
    @Permissions('discharge-summary:update')
    @Audit()
    async updateStatus(
        @Param('id') id: string,
        @OrganizationId() organizationId: string,
        @Body() dto: UpdateDischargeStatusDto,
        @Request() req: any,
    ) {
        return this.service.updateStatus(id, organizationId, dto, req.user?.id);
    }

    @Delete(':id')
    @Permissions('discharge-summary:delete')
    @Audit()
    async remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
        return this.service.remove(id, organizationId);
    }
}
