'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api-client';

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
    | 'departments'
    | 'pharmacy'
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
    | 'emergency'
    | 'blood-bank'
    | 'insurance'
    | 'ambulance'
    | 'discharge-summary'
    | 'analytics';  // Enterprise

type PlanTier = 'trial' | 'basic' | 'pro' | 'enterprise';

const planFeatures: Record<PlanTier, FeatureKey[]> = {
    trial: [
        'dashboard',
        'patients',
        'appointments',
        'doctors',
        'prescriptions',
        'pharmacy',
        'billing',
        'inventory',
        'departments',
        'notifications',
        'settings',
        'help'
    ],
    basic: [
        'dashboard',
        'patients',
        'appointments',
        'doctors',
        'prescriptions',
        'pharmacy',
        'billing',
        'inventory',
        'departments',
        'notifications',
        'settings',
        'help'
    ],
    pro: [
        'dashboard',
        'patients',
        'appointments',
        'doctors',
        'prescriptions',
        'pharmacy',
        'billing',
        'inventory',
        'departments',
        'notifications',
        'settings',
        'help',
        'laboratory',
        'wards',
        'staff',
        'opd-queue',
        'admissions',
        'emergency',
        'blood-bank',
        'insurance',
        'ambulance',
        'discharge-summary'
    ],
    enterprise: [
        'dashboard',
        'patients',
        'appointments',
        'doctors',
        'prescriptions',
        'pharmacy',
        'billing',
        'inventory',
        'departments',
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
        'emergency',
        'blood-bank',
        'insurance',
        'ambulance',
        'discharge-summary',
        'analytics'
    ],
};

export function useSubscription() {
    const { user } = useAuthStore();
    const [plan, setPlan] = useState<PlanTier>('basic');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSubscription() {
            if (!user?.organizationId) return;

            try {
                const response = await apiClient.get('/subscriptions/current');
                const tier = response.data?.plan?.tier as PlanTier;
                if (tier && planFeatures[tier]) {
                    setPlan(tier);
                }
            } catch {
                // If subscription fetch fails (no subscription yet), default to basic
                setPlan('basic');
            } finally {
                setIsLoading(false);
            }
        }

        fetchSubscription();
    }, [user?.organizationId]);

    const activeFeatures = planFeatures[plan];

    const hasFeature = (feature: string) => {
        if (isLoading) return true; // Show items during initial load for stability
        return activeFeatures.includes(feature as FeatureKey);
    };

    return {
        plan,
        hasFeature,
        isLoading,
    };
}
