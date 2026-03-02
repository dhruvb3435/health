import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class UpdateOnboardingStepDto {
    @IsString()
    step: string; // 'profile' | 'team' | 'demo' | 'modules' | 'complete'

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
