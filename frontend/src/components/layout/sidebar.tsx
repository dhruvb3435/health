'use client';
import React from 'react';
import { LogOut } from 'lucide-react';
import { useUIStore } from '@/lib/store';
import { useAuth } from '@/hooks/auth';
import { MobileNav } from './mobile-nav';
import { User } from '@/lib/store';

type SidebarProps = {
  user: User | null;
};

import { OrganizationSwitcher } from './organization-switcher';

export function Sidebar({ user }: SidebarProps) {
  const { isMobileMenuOpen } = useUIStore();
  const { logout } = useAuth();

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      <div className="flex h-20 items-center px-6 mb-2">
        <OrganizationSwitcher />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <MobileNav />
      </div>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
              <div className="flex h-full w-full items-center justify-center bg-blue-100 text-xs font-bold text-blue-700">
                {user?.firstName?.[0] || '?'}
                {user?.lastName?.[0] || '?'}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[11px] font-medium text-slate-500">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/50">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700">
              {user?.roles[0]}
            </span>
            <button
              onClick={logout}
              className="group flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
