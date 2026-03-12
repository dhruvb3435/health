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
  ApiParam,
} from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { OrganizationId } from '../../common/decorators/organization-id.decorator';
import {
  CreateInsuranceProviderDto,
  UpdateInsuranceProviderDto,
  CreateInsuranceClaimDto,
  UpdateInsuranceClaimDto,
  UpdateClaimStatusDto,
  ProviderFilterDto,
  ClaimFilterDto,
} from './dto/insurance.dto';

@ApiTags('Insurance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // ---------------------------------------------------------------------------
  // Provider endpoints
  // ---------------------------------------------------------------------------

  @Get('providers')
  @ApiOperation({ summary: 'List insurance providers / TPAs for the organization' })
  @Permissions('insurance:read')
  @Audit({ action: 'List Insurance Providers', entityType: 'InsuranceProvider' })
  getProviders(@Query() filters: ProviderFilterDto) {
    return this.insuranceService.getProviders(filters);
  }

  @Post('providers')
  @ApiOperation({ summary: 'Register a new insurance provider / TPA' })
  @Permissions('insurance:create')
  @Audit({ action: 'Create Insurance Provider', entityType: 'InsuranceProvider' })
  createProvider(@Body() dto: CreateInsuranceProviderDto) {
    return this.insuranceService.createProvider(dto);
  }

  @Patch('providers/:id')
  @ApiOperation({ summary: 'Update an insurance provider / TPA' })
  @ApiParam({ name: 'id', description: 'Insurance provider UUID' })
  @Permissions('insurance:update')
  @Audit({ action: 'Update Insurance Provider', entityType: 'InsuranceProvider' })
  updateProvider(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceProviderDto,
  ) {
    return this.insuranceService.updateProvider(id, dto);
  }

  @Delete('providers/:id')
  @ApiOperation({ summary: 'Delete an insurance provider (only if no claims are linked)' })
  @ApiParam({ name: 'id', description: 'Insurance provider UUID' })
  @Permissions('insurance:delete')
  @Audit({ action: 'Delete Insurance Provider', entityType: 'InsuranceProvider' })
  deleteProvider(@Param('id') id: string) {
    return this.insuranceService.deleteProvider(id);
  }

  // ---------------------------------------------------------------------------
  // Claim endpoints
  // ---------------------------------------------------------------------------

  @Get('claims/stats')
  @ApiOperation({ summary: 'Insurance claim statistics — totals by status and amounts' })
  @Permissions('insurance:read')
  @Audit({ action: 'View Claim Stats', entityType: 'InsuranceClaim' })
  getClaimStats(@OrganizationId() organizationId: string) {
    return this.insuranceService.getClaimStats(organizationId);
  }

  @Get('claims')
  @ApiOperation({ summary: 'List insurance claims with filters and pagination' })
  @Permissions('insurance:read')
  @Audit({ action: 'List Insurance Claims', entityType: 'InsuranceClaim' })
  getClaims(@Query() filters: ClaimFilterDto) {
    return this.insuranceService.getClaims(filters);
  }

  @Get('claims/:id')
  @ApiOperation({ summary: 'Get a single insurance claim by ID' })
  @ApiParam({ name: 'id', description: 'Insurance claim UUID' })
  @Permissions('insurance:read')
  @Audit({ action: 'View Insurance Claim', entityType: 'InsuranceClaim' })
  getClaimById(@Param('id') id: string) {
    return this.insuranceService.getClaimById(id);
  }

  @Post('claims')
  @ApiOperation({ summary: 'Create a new insurance claim (starts in draft status)' })
  @Permissions('insurance:create')
  @Audit({ action: 'Create Insurance Claim', entityType: 'InsuranceClaim' })
  createClaim(@Body() dto: CreateInsuranceClaimDto) {
    return this.insuranceService.createClaim(dto);
  }

  @Patch('claims/:id')
  @ApiOperation({ summary: 'Update a draft or query-raised insurance claim' })
  @ApiParam({ name: 'id', description: 'Insurance claim UUID' })
  @Permissions('insurance:update')
  @Audit({ action: 'Update Insurance Claim', entityType: 'InsuranceClaim' })
  updateClaim(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceClaimDto,
  ) {
    return this.insuranceService.updateClaim(id, dto);
  }

  @Patch('claims/:id/status')
  @ApiOperation({
    summary: 'Advance the claim workflow (submit → review → approve → settle / reject)',
  })
  @ApiParam({ name: 'id', description: 'Insurance claim UUID' })
  @Permissions('insurance:update')
  @Audit({ action: 'Update Claim Status', entityType: 'InsuranceClaim' })
  updateClaimStatus(
    @Param('id') id: string,
    @Body() dto: UpdateClaimStatusDto,
  ) {
    return this.insuranceService.updateClaimStatus(id, dto);
  }
}
