import { IsString, IsNotEmpty, IsOptional, IsEnum, IsJSON } from 'class-validator';
import { OrganizationStatus, SubscriptionPlan } from '../entities/organization.entity';

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsOptional()
    logoUrl?: string;

    @IsEnum(SubscriptionPlan)
    @IsOptional()
    subscriptionPlan?: SubscriptionPlan;

    @IsOptional()
    settings?: Record<string, any>;
}

export class UpdateOrganizationDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    logoUrl?: string;

    @IsEnum(OrganizationStatus)
    @IsOptional()
    status?: OrganizationStatus;

    @IsEnum(SubscriptionPlan)
    @IsOptional()
    subscriptionPlan?: SubscriptionPlan;

    @IsOptional()
    settings?: Record<string, any>;
}
