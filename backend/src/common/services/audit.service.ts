import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';
import { Request } from 'express';
import { PaginationQueryDto, PaginatedResponse } from '../dto/pagination.dto';

@Injectable()
export class AuditService {
  private logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) { }

  async logAction(
    userId: string,
    organizationId: string,
    userEmail: string,
    action: AuditAction,
    entityType: string,
    entityId: string | null,
    request: Request,
    changes?: Record<string, any>,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const auditLog = new AuditLog({
        userId,
        organizationId,
        userEmail,
        action,
        entityType,
        entityId,
        changes,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
        success: !errorMessage,
        errorMessage,
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      this.logger.error(`Failed to log audit: ${error.message}`);
    }
  }

  async getAuditLogs(
    organizationId: string,
    queryDto: PaginationQueryDto
  ): Promise<PaginatedResponse<AuditLog>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = queryDto;
    const skip = (page - 1) * limit;

    let query = this.auditRepository.createQueryBuilder('audit')
      .where('audit.organizationId = :organizationId', { organizationId });

    if (search) {
      query = query.andWhere(
        '(audit.userEmail ILIKE :search OR audit.entityType ILIKE :search OR audit.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy(`audit.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
