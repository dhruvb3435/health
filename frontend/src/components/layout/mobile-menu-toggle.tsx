'use client';

import { Menu, X } from 'lucide-react';
import { useUIStore } from '@/lib/store';

export function MobileMenuToggle() {
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useUIStore();

    return (
        <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:hidden"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
            {isMobileMenuOpen ? (
                <X className="h-6 w-6 animate-in spin-in-90 duration-200" />
            ) : (
                <Menu className="h-6 w-6 animate-in zoom-in-50 duration-200" />
            )}
        </button>
    );
}
