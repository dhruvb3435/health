import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, Revenue, PaymentStatus } from './entities/accounts.entity';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Revenue)
    private revenueRepository: Repository<Revenue>,
    private readonly tenantService: TenantService,
  ) {}

  async getExpenses(skip = 0, take = 10) {
    const organizationId = this.tenantService.getTenantId();
    const [expenses, total] = await this.expenseRepository.findAndCount({
      where: { organizationId },
      skip,
      take,
    });
    return { data: expenses, total, count: expenses.length };
  }

  async getRevenue(skip = 0, take = 10) {
    const organizationId = this.tenantService.getTenantId();
    const [revenue, total] = await this.revenueRepository.findAndCount({
      where: { organizationId },
      skip,
      take,
    });
    return { data: revenue, total, count: revenue.length };
  }

  async getPendingExpenses() {
    const organizationId = this.tenantService.getTenantId();
    return this.expenseRepository.find({ where: { status: PaymentStatus.PENDING, organizationId } });
  }

  async getTotalExpenses() {
    const organizationId = this.tenantService.getTenantId();
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.organizationId = :organizationId', { organizationId })
      .select('SUM(expense.amount)', 'total')
      .getRawOne();
    return parseFloat(result?.total || '0');
  }

  async getTotalRevenue() {
    const organizationId = this.tenantService.getTenantId();
    const result = await this.revenueRepository
      .createQueryBuilder('revenue')
      .where('revenue.organizationId = :organizationId', { organizationId })
      .select('SUM(revenue.amount)', 'total')
      .getRawOne();
    return parseFloat(result?.total || '0');
  }

  async getFinancialSummary() {
    const totalExpenses = await this.getTotalExpenses();
    const totalRevenue = await this.getTotalRevenue();
    const organizationId = this.tenantService.getTenantId();
    const pendingApprovals = await this.expenseRepository.count({
      where: { status: PaymentStatus.PENDING, organizationId },
    });
    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      pendingApprovals,
    };
  }

  async createExpense(data: Partial<Expense>) {
    const organizationId = this.tenantService.getTenantId();

    // Use MAX-based approach to avoid race condition with count-based IDs
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.organizationId = :organizationId', { organizationId })
      .select('MAX(expense.expenseId)', 'maxId')
      .getRawOne();

    let nextNumber = 1;
    if (result?.maxId) {
      const numericPart = result.maxId.split('-')[1];
      nextNumber = parseInt(numericPart, 10) + 1;
    }

    const expenseId = `EXP-${String(nextNumber).padStart(4, '0')}`;
    const expense = this.expenseRepository.create({
      ...data,
      expenseId,
      organizationId,
    });
    return this.expenseRepository.save(expense);
  }

  async deleteExpense(id: string) {
    const organizationId = this.tenantService.getTenantId();
    const expense = await this.expenseRepository.findOne({ where: { id, organizationId } });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return this.expenseRepository.remove(expense);
  }
}
