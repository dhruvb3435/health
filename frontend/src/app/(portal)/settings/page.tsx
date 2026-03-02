'use client';

import Link from 'next/link';
import {
    Settings,
    Building2,
    User,
    Bell,
    Shield,
    CreditCard,
    Puzzle,
    ChevronRight,
} from 'lucide-react';

const settingsCards = [
    {
        title: 'Organization Settings',
        description: 'Manage hospital identity, branding, and subscription details',
        icon: Building2,
        href: '/settings/organization',
        color: 'blue',
        available: true,
    },
    {
        title: 'Profile Settings',
        description: 'Update your personal information and account preferences',
        icon: User,
        href: '#',
        color: 'violet',
        available: false,
    },
    {
        title: 'Notification Preferences',
        description: 'Configure email, SMS, and in-app notification alerts',
        icon: Bell,
        href: '#',
        color: 'amber',
        available: false,
    },
    {
        title: 'Security & Privacy',
        description: 'Manage passwords, two-factor authentication, and data privacy',
        icon: Shield,
        href: '#',
        color: 'emerald',
        available: false,
    },
    {
        title: 'Billing & Subscription',
        description: 'View invoices, manage payment methods, and upgrade plans',
        icon: CreditCard,
        href: '#',
        color: 'rose',
        available: false,
    },
    {
        title: 'Integrations',
        description: 'Connect third-party services and manage API keys',
        icon: Puzzle,
        href: '#',
        color: 'cyan',
        available: false,
    },
];

const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
};

export default function SettingsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-6 w-6 md:h-7 md:w-7 text-slate-400" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">
                        Settings
                    </h1>
                </div>
                <p className="mt-1 text-sm md:text-base text-slate-500">
                    Manage your organization, profile, and application preferences
                </p>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {settingsCards.map((card) => {
                    const colors = colorMap[card.color];
                    const content = (
                        <div
                            className={`card p-5 shadow-sm border-slate-200 flex flex-col justify-between h-full transition-all ${
                                card.available
                                    ? 'hover:shadow-md hover:border-blue-200 cursor-pointer group'
                                    : 'opacity-80'
                            }`}
                        >
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <div
                                        className={`h-10 w-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} flex-shrink-0`}
                                    >
                                        <card.icon size={20} />
                                    </div>
                                    {!card.available && (
                                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200">
                                            Coming Soon
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {card.description}
                                </p>
                            </div>
                            {card.available && (
                                <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 mt-4 group-hover:gap-2 transition-all">
                                    Manage
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    );

                    if (card.available) {
                        return (
                            <Link key={card.title} href={card.href}>
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <div key={card.title}>
                            {content}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
