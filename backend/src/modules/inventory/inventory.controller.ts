import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryType } from './entities/inventory.entity';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/create-inventory.dto';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item' })
  @Audit({ action: 'Create Inventory Item', entityType: 'Inventory' })
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  @Audit({ action: 'List Inventory', entityType: 'Inventory' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Get inventory items by type' })
  @Audit({ action: 'List Inventory By Type', entityType: 'Inventory' })
  async getByType(@Query('type') type: string) {
    return this.inventoryService.getByType(type as InventoryType);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items with low stock' })
  @Audit({ action: 'View Low Stock Items', entityType: 'Inventory' })
  async getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }

  @Get('expired')
  @ApiOperation({ summary: 'Get expired items' })
  @Audit({ action: 'View Expired Items', entityType: 'Inventory' })
  async getExpiredItems() {
    return this.inventoryService.getExpiredItems();
  }

  @Get('stock-value')
  @ApiOperation({ summary: 'Get total stock value' })
  @Audit({ action: 'View Stock Value', entityType: 'Inventory' })
  async getStockValue() {
    return { stockValue: await this.inventoryService.getStockValue() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @Audit({ action: 'View Inventory Item', entityType: 'Inventory' })
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an inventory item' })
  @Audit({ action: 'Update Inventory Item', entityType: 'Inventory' })
  async update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an inventory item' })
  @Audit({ action: 'Delete Inventory Item', entityType: 'Inventory' })
  async remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
