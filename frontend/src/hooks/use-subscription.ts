'use client';

import { useOrganization } from './use-organization';

export type FeatureKey =
    | 'dashboard'
    | 'patients'
    | 'appointments'
    | 'doctors'
    | 'prescriptions'
    | 'billing'
    | 'laboratory'
    | 'radiology'    // Enterprise
    | 'staff'
    | 'opd-queue'
    | 'admissions'
    | 'inventory'
    | 'wards'
    | 'operation-theater' // Enterprise
    | 'accounts'    // Enterprise
    | 'compliance'  // Enterprise
    | 'notifications'
    | 'settings'
    | 'help'
    | 'analytics';  // Enterprise

export function useSubscription() {
    const { organization, isLoading } = useOrganization();

    const planData = {
        basic: {
            features: [
                'dashboard',
                'patients',
                'appointments',
                'doctors',
                'prescriptions',
                'billing',
                'inventory',
                'notifications',
                'settings',
                'help'
            ] as FeatureKey[],
        },
        premium: {
            features: [
                'dashboard',
                'patients',
                'appointments',
                'doctors',
                'prescriptions',
                'billing',
                'inventory',
                'notifications',
                'settings',
                'help',
                'laboratory',
                'wards',
                'staff',
                'opd-queue',
                'admissions'
            ] as FeatureKey[],
        },
        enterprise: {
            features: [
                'dashboard',
                'patients',
                'appointments',
                'doctors',
                'prescriptions',
                'billing',
                'inventory',
                'notifications',
                'settings',
                'help',
                'laboratory',
                'radiology',
                'wards',
                'staff',
                'opd-queue',
                'admissions',
                'operation-theater',
                'accounts',
                'compliance',
                'analytics'
            ] as FeatureKey[],
        },
    };

    const currentPlan = organization?.subscriptionPlan || 'basic';
    const activeFeatures = planData[currentPlan].features;

    const hasFeature = (feature: string) => {
        if (isLoading) return true; // Show items during initial load for stability
        return activeFeatures.includes(feature as FeatureKey);
    };

    return {
        plan: currentPlan,
        hasFeature,
        isLoading,
    };
}
