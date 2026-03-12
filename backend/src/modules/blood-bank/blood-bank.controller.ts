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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { BloodBankService } from './blood-bank.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { OrganizationId } from '../../common/decorators/organization-id.decorator';
import {
  CreateBloodInventoryDto,
  UpdateBloodInventoryDto,
  CreateBloodRequestDto,
  UpdateBloodRequestStatusDto,
  InventoryFilterDto,
  RequestFilterDto,
} from './dto/blood-bank.dto';
import { BloodGroup, BloodComponent } from './entities/blood-bank.entity';

@ApiTags('Blood Bank')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('blood-bank')
export class BloodBankController {
  constructor(private readonly bloodBankService: BloodBankService) {}

  // ---------------------------------------------------------------------------
  // Inventory endpoints
  // ---------------------------------------------------------------------------

  @Get('inventory')
  @ApiOperation({ summary: 'List blood inventory with optional filters' })
  @Permissions('blood-bank:read')
  @Audit({ action: 'List Blood Inventory', entityType: 'BloodInventory' })
  getInventory(@Query() filters: InventoryFilterDto) {
    return this.bloodBankService.getInventory(filters);
  }

  @Get('inventory/stats')
  @ApiOperation({ summary: 'Blood bank statistics grouped by blood group and status' })
  @Permissions('blood-bank:read')
  @Audit({ action: 'View Blood Bank Stats', entityType: 'BloodInventory' })
  getInventoryStats(@OrganizationId() organizationId: string) {
    return this.bloodBankService.getInventoryStats(organizationId);
  }

  @Post('inventory')
  @ApiOperation({ summary: 'Add a new blood unit to the inventory' })
  @Permissions('blood-bank:create')
  @Audit({ action: 'Add Blood Unit', entityType: 'BloodInventory' })
  addBloodUnit(@Body() dto: CreateBloodInventoryDto) {
    return this.bloodBankService.addBloodUnit(dto);
  }

  @Patch('inventory/:id')
  @ApiOperation({ summary: 'Update a blood inventory unit' })
  @ApiParam({ name: 'id', description: 'Blood inventory unit UUID' })
  @Permissions('blood-bank:update')
  @Audit({ action: 'Update Blood Unit', entityType: 'BloodInventory' })
  updateBloodUnit(
    @Param('id') id: string,
    @Body() dto: UpdateBloodInventoryDto,
  ) {
    return this.bloodBankService.updateBloodUnit(id, dto);
  }

  @Delete('inventory/:id')
  @ApiOperation({ summary: 'Remove a blood unit from the inventory' })
  @ApiParam({ name: 'id', description: 'Blood inventory unit UUID' })
  @Permissions('blood-bank:delete')
  @Audit({ action: 'Remove Blood Unit', entityType: 'BloodInventory' })
  removeBloodUnit(@Param('id') id: string) {
    return this.bloodBankService.removeBloodUnit(id);
  }

  // ---------------------------------------------------------------------------
  // Request endpoints
  // ---------------------------------------------------------------------------

  @Get('requests')
  @ApiOperation({ summary: 'List blood requests with optional filters' })
  @Permissions('blood-bank:read')
  @Audit({ action: 'List Blood Requests', entityType: 'BloodRequest' })
  getRequests(@Query() filters: RequestFilterDto) {
    return this.bloodBankService.getRequests(filters);
  }

  @Post('requests')
  @ApiOperation({ summary: 'Create a new blood request' })
  @Permissions('blood-bank:create')
  @Audit({ action: 'Create Blood Request', entityType: 'BloodRequest' })
  createRequest(@Body() dto: CreateBloodRequestDto) {
    return this.bloodBankService.createRequest(dto);
  }

  @Patch('requests/:id/status')
  @ApiOperation({ summary: 'Approve, issue, cancel, or complete a blood request' })
  @ApiParam({ name: 'id', description: 'Blood request UUID' })
  @Permissions('blood-bank:update')
  @Audit({ action: 'Update Blood Request Status', entityType: 'BloodRequest' })
  updateRequestStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBloodRequestStatusDto,
  ) {
    return this.bloodBankService.updateRequestStatus(id, dto);
  }

  // ---------------------------------------------------------------------------
  // Availability check
  // ---------------------------------------------------------------------------

  @Get('availability/:bloodGroup/:component')
  @ApiOperation({ summary: 'Check available units for a specific blood group and component' })
  @ApiParam({ name: 'bloodGroup', enum: BloodGroup, description: 'Blood group (e.g. O+, A-)' })
  @ApiParam({ name: 'component', enum: BloodComponent, description: 'Blood component type' })
  @Permissions('blood-bank:read')
  @Audit({ action: 'Check Blood Availability', entityType: 'BloodInventory' })
  checkAvailability(
    @Param('bloodGroup') bloodGroup: BloodGroup,
    @Param('component') component: BloodComponent,
  ) {
    return this.bloodBankService.checkAvailability(bloodGroup, component);
  }
}
