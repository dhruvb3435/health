export enum SubscriptionPlanTier {
    TRIAL = 'trial',
    BASIC = 'basic',
    PRO = 'pro',
    ENTERPRISE = 'enterprise',
}

export enum BillingCycle {
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
    ONCE = 'ONCE',
}

export enum SubscriptionStatus {
    TRIAL = 'TRIAL',
    ACTIVE = 'ACTIVE',
    PAST_DUE = 'PAST_DUE',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
}

export enum ResetInterval {
    MONTHLY = 'MONTHLY',
    LIFETIME = 'LIFETIME',
}
