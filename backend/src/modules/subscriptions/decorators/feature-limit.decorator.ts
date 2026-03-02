import { SetMetadata } from '@nestjs/common';

export const FEATURE_LIMIT_KEY = 'feature_limit_key';
export const RequireFeatureLimit = (featureKey: string) =>
    SetMetadata(FEATURE_LIMIT_KEY, featureKey);
