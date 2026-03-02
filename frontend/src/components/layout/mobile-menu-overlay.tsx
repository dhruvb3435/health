'use client';

import { useUIStore } from '@/lib/store';

export function MobileMenuOverlay() {
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useUIStore();

    if (!isMobileMenuOpen) return null;

    return (
        <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
        />
    );
}
