import { Controller, Get, Post, Body, UseGuards, Req, Headers, BadRequestException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { UpgradePlanDto, CancelSubscriptionDto } from './dto/subscription.dto';
import { PlanValidationGuard } from './guards/plan-validation.guard';

@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @Get('plans')
    async getAvailablePlans() {
        return this.subscriptionsService.getAvailablePlans();
    }

    @Get('current')
    async getCurrentSubscription(@Req() req: any) {
        return this.subscriptionsService.getCurrentSubscription(req.tenantId);
    }

    @Get('usage')
    @UseGuards(PlanValidationGuard)
    async getCurrentUsage(@Req() req: any) {
        return this.subscriptionsService.getCurrentUsage(req.tenantId);
    }

    @Post('upgrade')
    @UseGuards(PlanValidationGuard)
    async upgradePlan(@Req() req: any, @Body() dto: UpgradePlanDto) {
        return this.subscriptionsService.upgradePlan(req.tenantId, dto);
    }

    @Post('cancel')
    @UseGuards(PlanValidationGuard)
    async cancelPlan(@Req() req: any) {
        return this.subscriptionsService.cancelPlan(req.tenantId);
    }

    @Post('webhook')
    async stripeWebhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
        if (!signature) {
            throw new BadRequestException('Missing stripe-signature header');
        }

        if (!req.rawBody) {
            throw new BadRequestException('Raw body not available - ensure rawBody is enabled in NestFactory');
        }

        try {
            return await this.subscriptionsService.handleStripeWebhook(req.rawBody, signature);
        } catch (error: any) {
            console.error('Webhook Error:', error.message);
            throw new BadRequestException(`Webhook Error: ${error.message}`);
        }
    }
}
