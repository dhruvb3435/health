import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Patch,
} from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto, UpdateVitalsDto, AddNursingNoteDto, DischargeAdmissionDto } from './dto/create-admission.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Admissions')
@ApiBearerAuth()
@Controller('admissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdmissionsController {
    constructor(private readonly admissionsService: AdmissionsService) { }

    @Get()
    @Permissions('admissions:read')
    @Audit({ action: 'List Admissions', entityType: 'Admission' })
    findAll(@Query() query: PaginationQueryDto) {
        return this.admissionsService.findAll(query);
    }

    @Get(':id')
    @Permissions('admissions:read')
    @Audit({ action: 'View Admission', entityType: 'Admission' })
    findOne(@Param('id') id: string) {
        return this.admissionsService.findOne(id);
    }

    @Post()
    @Permissions('admissions:create')
    @Audit({ action: 'Create Admission', entityType: 'Admission' })
    create(@Body() createAdmissionDto: CreateAdmissionDto) {
        return this.admissionsService.create(createAdmissionDto);
    }

    @Patch(':id/vitals')
    @Permissions('admissions:update')
    @Audit({ action: 'Update Vitals', entityType: 'Admission' })
    updateVitals(@Param('id') id: string, @Body() updateVitalsDto: UpdateVitalsDto) {
        return this.admissionsService.updateVitals(id, updateVitalsDto);
    }

    @Patch(':id/notes')
    @Permissions('admissions:update')
    @Audit({ action: 'Add Nursing Note', entityType: 'Admission' })
    addNursingNote(@Param('id') id: string, @Body() addNursingNoteDto: AddNursingNoteDto) {
        return this.admissionsService.addNursingNote(id, addNursingNoteDto);
    }

    @Post(':id/discharge')
    @Permissions('admissions:update')
    @Audit({ action: 'Discharge Patient', entityType: 'Admission' })
    discharge(@Param('id') id: string, @Body() dischargeDto: DischargeAdmissionDto) {
        return this.admissionsService.discharge(id, dischargeDto);
    }

    @Get(':id/billing')
    @Permissions('admissions:read')
    @Audit({ action: 'View Admission Billing', entityType: 'Admission' })
    getBillingInfo(@Param('id') id: string) {
        return this.admissionsService.getBillingInfo(id);
    }
}
