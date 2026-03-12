import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import {
  RegisterEmergencyDto,
  TriageDto,
  UpdateEmergencyCaseDto,
  UpdateEmergencyStatusDto,
  EmergencyCaseFiltersDto,
  EmergencyCaseHistoryFiltersDto,
} from './dto/emergency.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Emergency')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  // ── Active board ──────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'Get active emergency cases',
    description:
      'Returns all active (non-disposed) emergency cases ordered by triage priority ' +
      '(most critical first) then arrival time. Suitable for the live ED dashboard.',
  })
  @ApiOkResponse({ description: 'Active cases with per-level summary' })
  @Permissions('emergency:read')
  async getActiveCases(@Query() filters: EmergencyCaseFiltersDto) {
    return this.emergencyService.getActiveCases(filters);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({
    summary: 'Get ED statistics',
    description:
      'Dashboard stats: active cases by triage level, average wait times ' +
      '(arrival→triage, triage→treatment), and today\'s case totals.',
  })
  @ApiOkResponse({ description: 'ED statistics snapshot' })
  @Permissions('emergency:read')
  async getStats() {
    return this.emergencyService.getStats();
  }

  // ── History ───────────────────────────────────────────────────────────────

  @Get('history')
  @ApiOperation({
    summary: 'Get paginated case history',
    description:
      'All emergency cases (including discharged, transferred, deceased) with ' +
      'optional date-range, status, triage level, and doctor filters.',
  })
  @ApiOkResponse({ description: 'Paginated case history' })
  @Permissions('emergency:read')
  async getCaseHistory(@Query() filters: EmergencyCaseHistoryFiltersDto) {
    return this.emergencyService.getCaseHistory(filters);
  }

  // ── Single case ───────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get emergency case by ID' })
  @ApiOkResponse({ description: 'Emergency case detail' })
  @ApiNotFoundResponse({ description: 'Case not found' })
  @Permissions('emergency:read')
  async findOne(@Param('id') id: string) {
    return this.emergencyService.findOne(id);
  }

  // ── Registration ──────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Register a new emergency case',
    description:
      'Creates a new ED case record. A unique case number (EMR-YYYYMMDD-NNN) is ' +
      'auto-generated. Patient can be unknown at registration and linked later.',
  })
  @ApiCreatedResponse({ description: 'Emergency case registered successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @Permissions('emergency:create')
  @Audit({ action: 'Register Emergency Case', entityType: 'EmergencyCase' })
  async registerCase(@Body() dto: RegisterEmergencyDto) {
    return this.emergencyService.registerCase(dto);
  }

  // ── Triage ────────────────────────────────────────────────────────────────

  @Patch(':id/triage')
  @ApiOperation({
    summary: 'Triage an emergency case',
    description:
      'Assigns ESI triage level and records vital signs. Sets triageTime and ' +
      'transitions the case to TRIAGED status. Optionally assigns a doctor.',
  })
  @ApiOkResponse({ description: 'Case triaged successfully' })
  @ApiNotFoundResponse({ description: 'Case not found' })
  @ApiBadRequestResponse({ description: 'Cannot triage — invalid state or validation error' })
  @Permissions('emergency:update')
  @Audit({ action: 'Triage Emergency Case', entityType: 'EmergencyCase' })
  async triageCase(@Param('id') id: string, @Body() dto: TriageDto) {
    return this.emergencyService.triageCase(id, dto);
  }

  // ── Status update ─────────────────────────────────────────────────────────

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update emergency case status',
    description:
      'Transitions the case status with automatic timestamp recording: ' +
      'treatmentStartTime on IN_TREATMENT, dispositionTime on terminal statuses. ' +
      'Terminal statuses: discharged, transferred, admitted, deceased.',
  })
  @ApiOkResponse({ description: 'Status updated successfully' })
  @ApiNotFoundResponse({ description: 'Case not found' })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @Permissions('emergency:update')
  @Audit({ action: 'Update Emergency Case Status', entityType: 'EmergencyCase' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEmergencyStatusDto,
  ) {
    return this.emergencyService.updateStatus(id, dto);
  }

  // ── General update ────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({
    summary: 'Update emergency case details',
    description:
      'General-purpose partial update for non-status fields: chief complaint, ' +
      'allergies, medical history, treatment notes, injury type, and vitals.',
  })
  @ApiOkResponse({ description: 'Case updated successfully' })
  @ApiNotFoundResponse({ description: 'Case not found' })
  @Permissions('emergency:update')
  @Audit({ action: 'Update Emergency Case', entityType: 'EmergencyCase' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmergencyCaseDto,
  ) {
    return this.emergencyService.update(id, dto);
  }
}
