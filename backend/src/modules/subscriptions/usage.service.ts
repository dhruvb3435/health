import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { OrganizationUsage } from './entities/organization-usage.entity';

@Injectable()
export class UsageService {
    private readonly logger = new Logger(UsageService.name);

    constructor(
        @InjectRepository(OrganizationUsage)
        private readonly usageRepository: Repository<OrganizationUsage>,
    ) { }

    /**
     * Atomically increments the usage count for a specific feature.
     * If no record exists for the organization/feature, it creates one.
     */
    async increment(organizationId: string, featureKey: string, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(OrganizationUsage) : this.usageRepository;

        try {
            // Postgres-specific UPSERT with atomic increment
            await repo.query(
                `INSERT INTO "organization_usage" ("organization_id", "feature_key", "used_count", "last_reset_at", "updated_at")
                 VALUES ($1, $2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT ("organization_id", "feature_key")
                 DO UPDATE SET "used_count" = "organization_usage"."used_count" + 1, "updated_at" = CURRENT_TIMESTAMP`,
                [organizationId, featureKey]
            );

            this.logger.log(`Incremented usage for ${featureKey} (Org: ${organizationId})`);
        } catch (error) {
            this.logger.error(`Failed to increment usage for ${featureKey}: ${error.message}`);
            throw error;
        }
    }

    async getUsage(organizationId: string, featureKey: string): Promise<number> {
        const usage = await this.usageRepository.findOne({
            where: { organizationId, featureKey },
        });
        return usage ? usage.usedCount : 0;
    }
}
