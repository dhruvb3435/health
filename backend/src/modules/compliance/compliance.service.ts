import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceRecord, DataAccessLog, ComplianceStatus, ComplianceType } from './entities/compliance.entity';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceRecord)
    private complianceRepository: Repository<ComplianceRecord>,
    @InjectRepository(DataAccessLog)
    private accessLogRepository: Repository<DataAccessLog>,
    private readonly tenantService: TenantService,
  ) { }

  async getComplianceRecords(skip = 0, take = 10) {
    const organizationId = this.tenantService.getTenantId();
    const [records, total] = await this.complianceRepository.findAndCount({
      where: { organizationId },
      skip,
      take,
    });
    return { data: records, total, count: records.length };
  }

  async getComplianceByType(type: string) {
    const organizationId = this.tenantService.getTenantId();
    return this.complianceRepository.find({ where: { complianceType: type as ComplianceType, organizationId } });
  }

  async getNonCompliantItems() {
    const organizationId = this.tenantService.getTenantId();
    return this.complianceRepository.find({
      where: { status: ComplianceStatus.NON_COMPLIANT, organizationId },
    });
  }

  async getAccessLogs(skip = 0, take = 100) {
    const organizationId = this.tenantService.getTenantId();
    const [logs, total] = await this.accessLogRepository.findAndCount({
      where: { organizationId },
      skip,
      take,
      order: { timestamp: 'DESC' },
    });
    return { data: logs, total, count: logs.length };
  }

  async getAccessLogsByUser(userId: string) {
    const organizationId = this.tenantService.getTenantId();
    return this.accessLogRepository.find({
      where: { userId, organizationId },
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  async createComplianceRecord(data: Partial<ComplianceRecord>) {
    const organizationId = this.tenantService.getTenantId();

    // Use MAX-based approach to avoid race condition with count-based IDs
    const result = await this.complianceRepository
      .createQueryBuilder('record')
      .where('record.organizationId = :organizationId', { organizationId })
      .select('MAX(record.recordId)', 'maxId')
      .getRawOne();

    let nextNumber = 1;
    if (result?.maxId) {
      const numericPart = result.maxId.split('-')[1];
      nextNumber = parseInt(numericPart, 10) + 1;
    }

    const recordId = `CMP-${String(nextNumber).padStart(4, '0')}`;
    const record = this.complianceRepository.create({
      ...data,
      recordId,
      organizationId,
    });
    return this.complianceRepository.save(record);
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
