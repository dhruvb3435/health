import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionStatus } from '../enums/subscription.enum';
import { UsageService } from '../usage.service';
import { FeatureLimit } from '../entities/feature-limit.entity';
import { Reflector } from '@nestjs/core';
import { FEATURE_LIMIT_KEY } from '../decorators/feature-limit.decorator';

@Injectable()
export class PlanValidationGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(FeatureLimit)
        private featureLimitRepository: Repository<FeatureLimit>,
        private usageService: UsageService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const organizationId = request.tenantId; // Set by TenantInterceptor

        if (!organizationId) {
            throw new ForbiddenException('Organization context is missing');
        }

        const subscription = await this.subscriptionRepository.findOne({
            where: { organizationId },
        });

        if (!subscription) {
            throw new HttpException('No active subscription found for this organization', HttpStatus.PAYMENT_REQUIRED);
        }

        // Allow ACTIVE and TRIAL plans to proceed
        if (subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.TRIAL) {
            // Check Feature Limits if decorator is present
            const featureKey = this.reflector.getAllAndOverride<string>(FEATURE_LIMIT_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

            if (featureKey) {
                await this.checkFeatureLimit(organizationId, subscription.planId, featureKey);
            }

            return true;
        }

        // PAST_DUE might still allow partial access in a real app,
        // but here we strictly require payment.
        if (subscription.status === SubscriptionStatus.PAST_DUE) {
            throw new HttpException('Subscription is past due. Please update your payment method.', HttpStatus.PAYMENT_REQUIRED);
        }

        throw new ForbiddenException(`Subscription status: ${subscription.status}`);
    }

    private async checkFeatureLimit(organizationId: string, planId: string, featureKey: string): Promise<void> {
        const featureLimit = await this.featureLimitRepository.findOne({
            where: { planId, featureKey },
        });

        if (!featureLimit) {
            throw new ForbiddenException(`Feature ${featureKey} not available in your plan.`);
        }

        if (!featureLimit.isEnabled) {
            throw new HttpException(
                `Feature ${featureKey} is disabled for your current plan. Please upgrade.`,
                HttpStatus.PAYMENT_REQUIRED
            );
        }

        if (featureLimit.limitValue === null || featureLimit.limitValue === -1) {
            return; // Unlimited
        }

        const currentUsage = await this.usageService.getUsage(organizationId, featureKey);

        if (currentUsage >= featureLimit.limitValue) {
            throw new HttpException(
                `Limit exceeded for ${featureKey}. Used: ${currentUsage}, Limit: ${featureLimit.limitValue}. Please upgrade your plan.`,
                HttpStatus.PAYMENT_REQUIRED
            );
        }
    }
}
