'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LogoutPage() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        // Perform logout
        logout();

        // Clear any other local storage if needed
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        toast.success('Logged out successfully');

        // Redirect to login
        router.replace('/auth/login');
    }, [logout, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="text-slate-600 font-medium">Logging you out...</p>
            </div>
        </div>
    );
}
