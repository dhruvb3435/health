import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { FeatureLimit } from './entities/feature-limit.entity';
import { OrganizationUsage } from './entities/organization-usage.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionCronService } from './subscription-cron.service';
import { UsageService } from './usage.service';
import { PlanValidationGuard } from './guards/plan-validation.guard';
import { FeatureLimitGuard } from './guards/feature-limit.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Plan,
            Subscription,
            FeatureLimit,
            OrganizationUsage,
            Organization,
            User,
        ]),
    ],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService, SubscriptionCronService, UsageService, PlanValidationGuard, FeatureLimitGuard],
    exports: [TypeOrmModule, SubscriptionsService, SubscriptionCronService, UsageService, PlanValidationGuard, FeatureLimitGuard],
})
export class SubscriptionsModule { }
