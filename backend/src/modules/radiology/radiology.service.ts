import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RadiologyRequest, ImagingStatus } from './entities/radiology.entity';

import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class RadiologyService {
  constructor(
    @InjectRepository(RadiologyRequest)
    private radiologyRepository: Repository<RadiologyRequest>,
    private readonly tenantService: TenantService,
  ) { }

  async getRadiologyRequests(skip = 0, take = 10) {
    const organizationId = this.tenantService.getTenantId();
    const [requests, total] = await this.radiologyRepository.findAndCount({
      where: { organizationId },
      skip,
      take,
    });
    return { data: requests, total, count: requests.length };
  }

  async getByPatient(patientId: string) {
    const organizationId = this.tenantService.getTenantId();
    return this.radiologyRepository.find({ where: { patientId, organizationId } });
  }

  async getByStatus(status: ImagingStatus) {
    const organizationId = this.tenantService.getTenantId();
    return this.radiologyRepository.find({ where: { status, organizationId } });
  }

  async getPendingReports() {
    return this.radiologyRepository.find({ where: { status: ImagingStatus.PENDING } });
  }

  async getCompletedReports() {
    return this.radiologyRepository.find({ where: { status: ImagingStatus.COMPLETED } });
  }
}
