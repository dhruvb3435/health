'use client';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { MobileMenuToggle } from '@/components/layout/mobile-menu-toggle';
import { useAuth } from '@/hooks/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md lg:hidden shadow-sm">
      <div className="flex items-center gap-3 h-full">
        <MobileMenuToggle />
        <Link href="/dashboard" className="h-full flex items-center">
          <img src="/logo.svg" alt="Aarogentix logo" className="h-16 w-auto" />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <button
          onClick={logout}
          className="group flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

