import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Plan } from '../../modules/subscriptions/entities/plan.entity';
import { FeatureLimit } from '../../modules/subscriptions/entities/feature-limit.entity';
import { Subscription } from '../../modules/subscriptions/entities/subscription.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { SubscriptionPlanTier, BillingCycle, SubscriptionStatus, ResetInterval } from '../../modules/subscriptions/enums/subscription.enum';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function seedPlans() {
    const { AppDataSource } = await import('../typeorm.config');

    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log('\n🌱 Starting to seed SaaS Plans and linking Orgs...\n');

        const planRepo = AppDataSource.getRepository(Plan);
        const featureRepo = AppDataSource.getRepository(FeatureLimit);
        const subRepo = AppDataSource.getRepository(Subscription);
        const orgRepo = AppDataSource.getRepository(Organization);

        // 1. Define Default Plans
        const plansData = [
            {
                tier: SubscriptionPlanTier.BASIC,
                name: 'Basic',
                slug: 'basic-monthly',
                description: 'For small clinics starting out.',
                price: 0,
                currency: 'INR',
                billingCycle: BillingCycle.MONTHLY,
            },
            {
                tier: SubscriptionPlanTier.PRO,
                name: 'Professional',
                slug: 'pro-monthly',
                description: 'For growing hospitals.',
                price: 2999,
                currency: 'INR',
                billingCycle: BillingCycle.MONTHLY,
            },
            {
                tier: SubscriptionPlanTier.ENTERPRISE,
                name: 'Enterprise',
                slug: 'enterprise-monthly',
                description: 'Unlimited access and features for large organizations.',
                price: 9999,
                currency: 'INR',
                billingCycle: BillingCycle.MONTHLY,
            }
        ];

        const cachedPlans: Record<string, Plan> = {};

        for (const data of plansData) {
            let plan = await planRepo.findOne({ where: { slug: data.slug } });
            if (!plan) {
                plan = await planRepo.save(planRepo.create(data));
                console.log(`Created Plan: ${data.name}`);
            }
            cachedPlans[data.tier] = plan;
        }

        // 2. Define Feature Limits for Plans
        const featuresData = [
            // BASIC PLAN
            { planTier: SubscriptionPlanTier.BASIC, featureKey: 'MAX_PATIENTS', limitValue: 100, isEnabled: true, resetInterval: ResetInterval.LIFETIME },
            { planTier: SubscriptionPlanTier.BASIC, featureKey: 'MAX_STAFF', limitValue: 5, isEnabled: true, resetInterval: ResetInterval.LIFETIME },
            { planTier: SubscriptionPlanTier.BASIC, featureKey: 'ADVANCED_ANALYTICS', limitValue: null, isEnabled: false, resetInterval: ResetInterval.LIFETIME },
            { planTier: SubscriptionPlanTier.BASIC, featureKey: 'SMS_NOTIFICATIONS', limitValue: 0, isEnabled: false, resetInterval: ResetInterval.MONTHLY },
            // PRO PLAN
            { planTier: SubscriptionPlanTier.PRO, featureKey: 'MAX_PATIENTS', limitValue: 5000, isEnabled: true, resetInterval: ResetInterval.LIFETIME },
            { planTier: SubscriptionPlanTier.PRO, featureKey: 'MAX_STAFF', limitValue: 50, isEnabled: true, resetInterval: ResetInterval.LIFETIME },
            { planTier: SubscriptionPlanTier.PRO, featureKey: 'ADVANCED_ANALYTICS', limitValue: null, isEnabled: true, resetInterval: ResetInterval.LIFETIME },
            { planTier: SubscriptionPlanTier.PRO, featureKey: 'SMS_NOTIFICATIONS', limitValue: 1000, isEnabled: true, resetInterval: ResetInterval.MONTHLY },
            // ENTERPRISE PLAN (-1 for unlimited)
            { planTier: SubscriptionPlanTier.ENTERPRISE, featureKey: 'MAX_PATIENTS', limitValue: -1, isEnabled: true, resetInterval: ResetInterval.LIFETIME },
            { planTier: SubscriptionPlanTier.ENTERPRISE, featureKey: 'MAX_STAFF', limitValue: -1, isEnabled: true, resetInterval: ResetInterval.LIFETIME },
            { planTier: SubscriptionPlanTier.ENTERPRISE, featureKey: 'ADVANCED_ANALYTICS', limitValue: null, isEnabled: true, resetInterval: ResetInterval.LIFETIME },
            { planTier: SubscriptionPlanTier.ENTERPRISE, featureKey: 'SMS_NOTIFICATIONS', limitValue: -1, isEnabled: true, resetInterval: ResetInterval.MONTHLY },
        ];

        console.log('Validating Feature Limits...');
        for (const f of featuresData) {
            const plan = cachedPlans[f.planTier];
            const existing = await featureRepo.findOne({ where: { planId: plan.id, featureKey: f.featureKey } });
            if (!existing) {
                await featureRepo.save(featureRepo.create({
                    planId: plan.id,
                    featureKey: f.featureKey,
                    limitValue: f.limitValue,
                    isEnabled: f.isEnabled,
                    resetInterval: f.resetInterval,
                }));
            }
        }

        // 3. Attach Subscriptions to existing Organizations
        console.log('Attaching Subscriptions to Organizations...');
        const orgs = await orgRepo.find();

        for (const targetOrg of orgs) {
            let sub = await subRepo.findOne({ where: { organizationId: targetOrg.id } });
            if (!sub) {
                // Assign basic plan if no prior intent, or enterprise if it's the demo org
                const isDemo = targetOrg.slug === 'aarogentix-health' || targetOrg.slug === 'premium-care';
                const assignedPlan = isDemo ? cachedPlans[SubscriptionPlanTier.ENTERPRISE] : cachedPlans[SubscriptionPlanTier.BASIC];

                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);

                await subRepo.save(subRepo.create({
                    organizationId: targetOrg.id,
                    planId: assignedPlan.id,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: nextMonth,
                }));
                console.log(`Assigned ${assignedPlan.name} Subscription to Org: ${targetOrg.slug}`);
            }
        }

        console.log('\n✅ SaaS Plans Seeding Completed!');
    } catch (error) {
        console.error('Error seeding plans:', error);
        process.exit(1);
    } finally {
        const { AppDataSource } = await import('../typeorm.config');
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

seedPlans();
