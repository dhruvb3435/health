import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Accounts & Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get('expenses')
  @ApiOperation({ summary: 'Get all expenses' })
  @Permissions('accounts:read')
  @Audit({ action: 'List Expenses', entityType: 'Account' })
  async getExpenses(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.accountsService.getExpenses(skip, parseInt(limit));
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Create a new expense' })
  @Permissions('accounts:write')
  @Audit({ action: 'Create Expense', entityType: 'Account' })
  async createExpense(@Body() body: any) {
    return this.accountsService.createExpense(body);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete an expense' })
  @Permissions('accounts:write')
  @Audit({ action: 'Delete Expense', entityType: 'Account' })
  async deleteExpense(@Param('id') id: string) {
    return this.accountsService.deleteExpense(id);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get all revenue' })
  @Permissions('accounts:read')
  @Audit({ action: 'List Revenue', entityType: 'Account' })
  async getRevenue(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.accountsService.getRevenue(skip, parseInt(limit));
  }

  @Get('pending-expenses')
  @ApiOperation({ summary: 'Get pending expenses' })
  @Permissions('accounts:read')
  @Audit({ action: 'List Pending Expenses', entityType: 'Account' })
  async getPendingExpenses() {
    return this.accountsService.getPendingExpenses();
  }

  @Get('financial-summary')
  @ApiOperation({ summary: 'Get financial summary' })
  @Permissions('accounts:read')
  @Audit({ action: 'View Financial Summary', entityType: 'Account' })
  async getFinancialSummary() {
    return this.accountsService.getFinancialSummary();
  }
}
