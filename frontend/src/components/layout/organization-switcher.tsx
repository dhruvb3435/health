'use client';

import React from 'react';
import { ChevronRight, Building2, Crown } from 'lucide-react';
import { useOrganization } from '@/hooks/use-organization';

export function OrganizationSwitcher() {
    const { organization, isLoading } = useOrganization();

    if (isLoading) {
        return (
            <div className="flex items-center gap-3 p-2 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-slate-100" />
                    <div className="h-2 w-16 rounded bg-slate-100" />
                </div>
            </div>
        );
    }

    if (!organization) return null;

    const isPremium = organization.subscriptionPlan === 'premium' || organization.subscriptionPlan === 'enterprise';

    return (
        <div className="group relative flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 transition-all hover:bg-slate-50 border border-slate-200/60 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer">
            {/* Organization Logo/Icon */}
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${isPremium ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-100 text-slate-600'
                } shadow-lg ring-1 ring-white`}>
                {organization.logoUrl ? (
                    <img src={organization.logoUrl} alt={organization.name} className="h-7 w-7 object-contain" />
                ) : (
                    <Building2 className="h-6 w-6" />
                )}
            </div>

            {/* Organization Info */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center gap-1.5">
                    <h2 className="truncate text-sm font-bold tracking-tight text-slate-900">
                        {organization.name}
                    </h2>
                    {isPremium && (
                        <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm">
                            <Crown className="h-2 w-2" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${organization.status === 'active' ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                        {organization.status}
                    </span>
                    <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                    <span className="truncate text-[10px] font-medium text-slate-500">
                        {organization.slug}.aarogentix.com
                    </span>
                </div>
            </div>

            {/* Action Indicator */}
            <div className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all group-hover:opacity-100 group-hover:bg-slate-200/50">
                <ChevronRight className="h-4 w-4" />
            </div>
        </div>
    );
}
