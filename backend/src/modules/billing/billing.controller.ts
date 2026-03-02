import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/create-invoice.dto';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Post('invoices')
    @ApiOperation({ summary: 'Create a new invoice' })
    @Audit({ action: 'Create Invoice', entityType: 'Invoice' })
    async create(@Body() createInvoiceDto: CreateInvoiceDto) {
        return this.billingService.create(createInvoiceDto);
    }

    @Get('invoices')
    @ApiOperation({ summary: 'Get all invoices' })
    @Audit({ action: 'List Invoices', entityType: 'Invoice' })
    async findAll(@Query() query: PaginationQueryDto) {
        return this.billingService.findAll(query);
    }

    @Get('invoices/:id')
    @ApiOperation({ summary: 'Get invoice by ID' })
    @Audit({ action: 'View Invoice', entityType: 'Invoice' })
    async findOne(@Param('id') id: string) {
        return this.billingService.findOne(id);
    }

    @Patch('invoices/:id')
    @ApiOperation({ summary: 'Update an invoice' })
    @Audit({ action: 'Update Invoice', entityType: 'Invoice' })
    async update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
        return this.billingService.update(id, updateInvoiceDto);
    }

    @Delete('invoices/:id')
    @ApiOperation({ summary: 'Delete an invoice' })
    @Audit({ action: 'Delete Invoice', entityType: 'Invoice' })
    async remove(@Param('id') id: string) {
        return this.billingService.remove(id);
    }
}
