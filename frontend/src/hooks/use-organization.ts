'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api-client';
import { Organization } from '@/types';

export function useOrganization() {
    const { user } = useAuthStore();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOrganization() {
            if (!user?.organizationId) return;

            setIsLoading(true);
            setError(null);
            try {
                const response = await apiClient.get<Organization>(`/organizations/${user.organizationId}`);
                setOrganization(response.data);
            } catch (err: any) {
                console.error('Error fetching organization:', err);
                setError(err.response?.data?.message || 'Failed to load organization details');
            } finally {
                setIsLoading(false);
            }
        }

        if (user?.organizationId) {
            fetchOrganization();
        }
    }, [user?.organizationId]);

    return { organization, isLoading, error };
}
