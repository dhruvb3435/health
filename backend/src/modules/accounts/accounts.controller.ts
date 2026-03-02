import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Accounts & Finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get('expenses')
  async getExpenses(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.accountsService.getExpenses(skip, parseInt(limit));
  }

  @Get('revenue')
  async getRevenue(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.accountsService.getRevenue(skip, parseInt(limit));
  }

  @Get('pending-expenses')
  async getPendingExpenses() {
    return this.accountsService.getPendingExpenses();
  }

  @Get('financial-summary')
  async getFinancialSummary() {
    return this.accountsService.getFinancialSummary();
  }
}
