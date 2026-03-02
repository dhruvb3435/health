import { IsString, IsNotEmpty } from 'class-validator';

export class UpgradePlanDto {
    @IsString()
    @IsNotEmpty()
    planId: string;
}

export class CancelSubscriptionDto {
    @IsString()
    @IsNotEmpty()
    subscriptionId: string;
}
