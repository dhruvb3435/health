import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, Revenue, PaymentStatus } from './entities/accounts.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Revenue)
    private revenueRepository: Repository<Revenue>,
  ) {}

  async getExpenses(skip = 0, take = 10) {
    const [expenses, total] = await this.expenseRepository.findAndCount({
      skip,
      take,
    });
    return { data: expenses, total, count: expenses.length };
  }

  async getRevenue(skip = 0, take = 10) {
    const [revenue, total] = await this.revenueRepository.findAndCount({
      skip,
      take,
    });
    return { data: revenue, total, count: revenue.length };
  }

  async getPendingExpenses() {
    return this.expenseRepository.find({ where: { status: PaymentStatus.PENDING } });
  }

  async getTotalExpenses() {
    const expenses = await this.expenseRepository.find();
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }

  async getTotalRevenue() {
    const revenues = await this.revenueRepository.find();
    return revenues.reduce((sum, rev) => sum + Number(rev.amount), 0);
  }

  async getFinancialSummary() {
    const totalExpenses = await this.getTotalExpenses();
    const totalRevenue = await this.getTotalRevenue();
    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }
}
