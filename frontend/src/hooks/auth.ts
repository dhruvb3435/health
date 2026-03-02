'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export function useRequireAuth() {
  const router = useRouter();
  const { user, isLoading, isHydrated } = useAuthStore();

  useEffect(() => {
    // ONLY check for auth if we have finished hydrating the store from localStorage
    if (isHydrated && !isLoading && !user) {
      console.warn('Unauthorized access detected, redirecting to login...');
      router.push('/auth/login');
    }
  }, [user, isLoading, isHydrated, router]);

  return { user, isLoading: !isHydrated || isLoading };
}

export function useAuth() {
  const { user, logout, isLoading, isHydrated } = useAuthStore();
  return { user, logout, isLoading, isHydrated };
}

export function useRequireRole(...roles: string[]) {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && user && !roles.some((role) => user.roles.includes(role))) {
      router.push('/');
    }
  }, [user, roles, isHydrated, router]);

  return { user };
}
