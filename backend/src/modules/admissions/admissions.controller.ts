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
import { Audit } from '../../common/decorators/audit.decorator';

@Controller('admissions')
@UseGuards(JwtAuthGuard)
export class AdmissionsController {
    constructor(private readonly admissionsService: AdmissionsService) { }

    @Get()
    @Audit({ action: 'List Admissions', entityType: 'Admission' })
    findAll(@Query() query: PaginationQueryDto) {
        return this.admissionsService.findAll(query);
    }

    @Get(':id')
    @Audit({ action: 'View Admission', entityType: 'Admission' })
    findOne(@Param('id') id: string) {
        return this.admissionsService.findOne(id);
    }

    @Post()
    @Audit({ action: 'Create Admission', entityType: 'Admission' })
    create(@Body() createAdmissionDto: CreateAdmissionDto) {
        return this.admissionsService.create(createAdmissionDto);
    }

    @Patch(':id/vitals')
    @Audit({ action: 'Update Vitals', entityType: 'Admission' })
    updateVitals(@Param('id') id: string, @Body() updateVitalsDto: UpdateVitalsDto) {
        return this.admissionsService.updateVitals(id, updateVitalsDto);
    }

    @Patch(':id/notes')
    @Audit({ action: 'Add Nursing Note', entityType: 'Admission' })
    addNursingNote(@Param('id') id: string, @Body() addNursingNoteDto: AddNursingNoteDto) {
        return this.admissionsService.addNursingNote(id, addNursingNoteDto);
    }

    @Post(':id/discharge')
    @Audit({ action: 'Discharge Patient', entityType: 'Admission' })
    discharge(@Param('id') id: string, @Body() dischargeDto: DischargeAdmissionDto) {
        return this.admissionsService.discharge(id, dischargeDto);
    }

    @Get(':id/billing')
    @Audit({ action: 'View Admission Billing', entityType: 'Admission' })
    getBillingInfo(@Param('id') id: string) {
        return this.admissionsService.getBillingInfo(id);
    }
}
