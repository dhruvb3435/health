import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { FeatureLimit } from '../entities/feature-limit.entity';
import { OrganizationUsage } from '../entities/organization-usage.entity';
import { FEATURE_LIMIT_KEY } from '../decorators/feature-limit.decorator';

@Injectable()
export class FeatureLimitGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(FeatureLimit)
        private featureLimitRepository: Repository<FeatureLimit>,
        @InjectRepository(OrganizationUsage)
        private readonly organizationUsageRepository: Repository<OrganizationUsage>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const featureKey = this.reflector.getAllAndOverride<string>(FEATURE_LIMIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!featureKey) {
            return true; // No feature limit defined for this route
        }

        const request = context.switchToHttp().getRequest();
        const organizationId = request.tenantId;

        if (!organizationId) {
            throw new ForbiddenException('Organization context missing for feature check.');
        }

        // 1. Get Subscription
        const subscription = await this.subscriptionRepository.findOne({
            where: { organizationId },
        });

        if (!subscription) {
            throw new HttpException('Active subscription required.', HttpStatus.PAYMENT_REQUIRED);
        }

        // 2. Get Plan's Limit for this Feature
        const featureLimit = await this.featureLimitRepository.findOne({
            where: { planId: subscription.planId, featureKey },
        });

        if (!featureLimit) {
            throw new ForbiddenException(`Feature ${featureKey} not available in your plan.`);
        }

        // 3. Simple boolean toggle check
        if (!featureLimit.isEnabled) {
            throw new HttpException(
                `Feature ${featureKey} is disabled for your current plan. Please upgrade.`, HttpStatus.PAYMENT_REQUIRED
            );
        }

        // Unlimited
        if (featureLimit.limitValue === null || featureLimit.limitValue === -1) {
            return true;
        }

        // 4. Usage check against Limit
        const usage = await this.organizationUsageRepository.findOne({
            where: { organizationId, featureKey },
        });

        const currentUsage = usage?.usedCount || 0;

        if (currentUsage >= featureLimit.limitValue) {
            throw new HttpException(
                `Limit exceeded for ${featureKey}. Used: ${currentUsage}, Limit: ${featureLimit.limitValue}. Please upgrade your plan.`, HttpStatus.PAYMENT_REQUIRED
            );
        }

        return true;
    }
}
