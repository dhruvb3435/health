import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AmbulanceService } from './ambulance.service';
import {
  CreateAmbulanceDto,
  UpdateAmbulanceDto,
  DispatchAmbulanceDto,
  UpdateTripStatusDto,
  AmbulanceFiltersDto,
  TripFiltersDto,
} from './dto/ambulance.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Ambulance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ambulance')
export class AmbulanceController {
  constructor(private readonly ambulanceService: AmbulanceService) {}

  // ── Fleet endpoints ───────────────────────────────────────────────────────

  @Get('fleet')
  @ApiOperation({
    summary: 'List fleet ambulances',
    description:
      'Returns all ambulances for the organization. Supports filtering by status, ' +
      'vehicle type, and a text search on vehicle number or driver name. ' +
      'Inactive vehicles are excluded unless includeInactive=true.',
  })
  @ApiOkResponse({ description: 'List of ambulances' })
  @Permissions('ambulance:read')
  getAmbulances(@Query() filters: AmbulanceFiltersDto) {
    return this.ambulanceService.getAmbulances(filters);
  }

  @Get('fleet/stats')
  @ApiOperation({
    summary: 'Fleet statistics',
    description:
      'Returns a dashboard snapshot: total active ambulances broken down by ' +
      'operational status, count of in-progress trips, and today\'s trip totals by type.',
  })
  @ApiOkResponse({ description: 'Fleet statistics snapshot' })
  @Permissions('ambulance:read')
  getFleetStats() {
    return this.ambulanceService.getFleetStats();
  }

  @Post('fleet')
  @ApiOperation({
    summary: 'Register a new ambulance',
    description:
      'Adds a new vehicle to the fleet. Vehicle number must be unique within the organization.',
  })
  @ApiCreatedResponse({ description: 'Ambulance registered successfully' })
  @ApiConflictResponse({ description: 'Vehicle number already exists for this organization' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @Permissions('ambulance:create')
  @Audit({ action: 'Register Ambulance', entityType: 'Ambulance' })
  createAmbulance(@Body() dto: CreateAmbulanceDto) {
    return this.ambulanceService.createAmbulance(dto);
  }

  @Patch('fleet/:id')
  @ApiOperation({
    summary: 'Update ambulance details',
    description:
      'Partial update for any ambulance field including status, driver details, ' +
      'equipment list, and compliance dates. Re-validates vehicle number uniqueness if changed.',
  })
  @ApiParam({ name: 'id', description: 'Ambulance UUID' })
  @ApiOkResponse({ description: 'Ambulance updated successfully' })
  @ApiNotFoundResponse({ description: 'Ambulance not found' })
  @ApiConflictResponse({ description: 'Vehicle number already taken by another vehicle' })
  @Permissions('ambulance:update')
  @Audit({ action: 'Update Ambulance', entityType: 'Ambulance' })
  updateAmbulance(@Param('id') id: string, @Body() dto: UpdateAmbulanceDto) {
    return this.ambulanceService.updateAmbulance(id, dto);
  }

  @Delete('fleet/:id')
  @ApiOperation({
    summary: 'Deactivate an ambulance',
    description:
      'Soft-deletes the ambulance by setting isActive=false. ' +
      'Preserves all historical trip records. ' +
      'Cannot deactivate a vehicle that is currently on a trip.',
  })
  @ApiParam({ name: 'id', description: 'Ambulance UUID' })
  @ApiOkResponse({ description: 'Ambulance deactivated' })
  @ApiNotFoundResponse({ description: 'Ambulance not found' })
  @ApiBadRequestResponse({ description: 'Ambulance is currently on a trip' })
  @Permissions('ambulance:delete')
  @Audit({ action: 'Deactivate Ambulance', entityType: 'Ambulance' })
  deleteAmbulance(@Param('id') id: string) {
    return this.ambulanceService.deleteAmbulance(id);
  }

  // ── Trip endpoints ────────────────────────────────────────────────────────

  @Get('trips')
  @ApiOperation({
    summary: 'List trips (paginated)',
    description:
      'Returns a paginated list of all ambulance trips for the organization. ' +
      'Supports filtering by status, trip type, priority, ambulance, and date range.',
  })
  @ApiOkResponse({ description: 'Paginated trip list with meta' })
  @Permissions('ambulance:read')
  getTrips(@Query() filters: TripFiltersDto) {
    return this.ambulanceService.getTrips(filters);
  }

  @Get('trips/active')
  @ApiOperation({
    summary: 'Get active trips',
    description:
      'Returns all currently in-progress trips (dispatched, en_route_pickup, ' +
      'patient_picked, en_route_hospital). Ordered by priority (critical first) ' +
      'then dispatch time (oldest first). Suitable for the live dispatch board.',
  })
  @ApiOkResponse({ description: 'List of active trips' })
  @Permissions('ambulance:read')
  getActiveTrips() {
    return this.ambulanceService.getActiveTrips();
  }

  @Post('trips/dispatch')
  @ApiOperation({
    summary: 'Dispatch an ambulance',
    description:
      'Creates a new trip and sets the selected ambulance to on_trip status. ' +
      'The ambulance must currently be in "available" status. ' +
      'A trip number (TRIP-YYYYMMDD-NNN) is auto-generated.',
  })
  @ApiCreatedResponse({ description: 'Trip created and ambulance dispatched' })
  @ApiBadRequestResponse({ description: 'Ambulance is not available or is inactive' })
  @ApiNotFoundResponse({ description: 'Ambulance not found' })
  @Permissions('ambulance:create')
  @Audit({ action: 'Dispatch Ambulance', entityType: 'AmbulanceTrip' })
  dispatchAmbulance(@Body() dto: DispatchAmbulanceDto) {
    return this.ambulanceService.dispatchAmbulance(dto);
  }

  @Patch('trips/:id/status')
  @ApiOperation({
    summary: 'Update trip status',
    description:
      'Advances the trip through its lifecycle. Automatic timestamps are recorded: ' +
      'patient_picked → pickupTime, en_route_hospital → arrivalTime, ' +
      'completed / cancelled → completionTime. ' +
      'When a trip is completed or cancelled the ambulance is automatically ' +
      'returned to "available" status.',
  })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiOkResponse({ description: 'Trip status updated' })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiBadRequestResponse({ description: 'Trip is already in a terminal state or same status' })
  @Permissions('ambulance:update')
  @Audit({ action: 'Update Trip Status', entityType: 'AmbulanceTrip' })
  updateTripStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTripStatusDto,
  ) {
    return this.ambulanceService.updateTripStatus(id, dto);
  }

  @Get('trips/:id')
  @ApiOperation({ summary: 'Get trip by ID' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiOkResponse({ description: 'Trip detail with ambulance and patient relations' })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @Permissions('ambulance:read')
  findOneTrip(@Param('id') id: string) {
    return this.ambulanceService.findOneTrip(id);
  }
}
