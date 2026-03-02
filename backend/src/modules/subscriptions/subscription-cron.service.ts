import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionStatus } from './enums/subscription.enum';
import { Organization, OrganizationStatus } from '../organizations/entities/organization.entity';

@Injectable()
export class SubscriptionCronService {
    private readonly logger = new Logger(SubscriptionCronService.name);

    constructor(
        @InjectRepository(Subscription)
        private readonly subscriptionsRepository: Repository<Subscription>,
        @InjectRepository(Organization)
        private readonly organizationsRepository: Repository<Organization>,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleTrialExpiration() {
        this.logger.log('Starting daily trial expiration check...');

        const now = new Date();
        const expiredSubscriptions = await this.subscriptionsRepository.find({
            where: {
                status: SubscriptionStatus.TRIAL,
                trialEndDate: LessThan(now),
            },
        });

        if (expiredSubscriptions.length === 0) {
            this.logger.log('No expired trials found.');
            return;
        }

        this.logger.log(`Found ${expiredSubscriptions.length} expired trials. processing...`);

        for (const sub of expiredSubscriptions) {
            try {
                // Use a transaction to ensure atomicity
                await this.subscriptionsRepository.manager.transaction(async (transactionalEntityManager) => {
                    // 1. Update Subscription Status
                    sub.status = SubscriptionStatus.EXPIRED;
                    await transactionalEntityManager.save(sub);

                    // 2. Update Organization Status
                    const org = await transactionalEntityManager.findOne(Organization, {
                        where: { id: sub.organizationId },
                    });

                    if (org) {
                        org.status = OrganizationStatus.EXPIRED;
                        await transactionalEntityManager.save(org);
                    }

                    this.logger.log(`Subscription ${sub.id} (Org: ${sub.organizationId}) has been set to EXPIRED.`);
                });
            } catch (error) {
                this.logger.error(`Failed to expire trial for subscription ${sub.id}: ${error.message}`);
            }
        }

        this.logger.log('Trial expiration check completed.');
    }
}
