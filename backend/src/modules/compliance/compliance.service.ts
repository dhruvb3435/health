import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceRecord, DataAccessLog, ComplianceStatus, ComplianceType } from './entities/compliance.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceRecord)
    private complianceRepository: Repository<ComplianceRecord>,
    @InjectRepository(DataAccessLog)
    private accessLogRepository: Repository<DataAccessLog>,
  ) { }

  async getComplianceRecords(skip = 0, take = 10) {
    const [records, total] = await this.complianceRepository.findAndCount({
      skip,
      take,
    });
    return { data: records, total, count: records.length };
  }

  async getComplianceByType(type: string) {
    return this.complianceRepository.find({ where: { complianceType: type as ComplianceType } });
  }

  async getNonCompliantItems() {
    return this.complianceRepository.find({
      where: { status: ComplianceStatus.NON_COMPLIANT },
    });
  }

  async getAccessLogs(skip = 0, take = 100) {
    const [logs, total] = await this.accessLogRepository.findAndCount({
      skip,
      take,
      order: { timestamp: 'DESC' },
    });
    return { data: logs, total, count: logs.length };
  }

  async getAccessLogsByUser(userId: string) {
    return this.accessLogRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  async logDataAccess(
    userId: string,
    organizationId: string,
    action: string,
    entityType: string,
    entityId: string,
    reason?: string,
  ) {
    const log = this.accessLogRepository.create({
      userId,
      organizationId,
      action,
      entityType,
      entityId,
      timestamp: new Date(),
      reason,
      status: 'success',
    });
    return this.accessLogRepository.save(log);
  }
}
