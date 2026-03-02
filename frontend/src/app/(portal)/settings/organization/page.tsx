'use client';

import React, { useState, useEffect } from 'react';
import { useRequireRole } from '@/hooks/auth';
import { useOrganization } from '@/hooks/use-organization';
import { useSubscription } from '@/hooks/use-subscription';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import {
    Building2,
    Globe,
    ShieldCheck,
    Save,
    Image as ImageIcon,
    Crown,
    ChevronRight
} from 'lucide-react';

export default function OrganizationSettingsPage() {
    useRequireRole('admin', 'super_admin', 'owner');
    const { organization, isLoading, error } = useOrganization();
    const { plan } = useSubscription();
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        if (organization) {
            setName(organization.name);
            setLogoUrl(organization.logoUrl || '');
        }
    }, [organization]);

    const handleSave = async () => {
        if (!organization) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            await apiClient.patch(`/organizations/${organization.id}`, {
                name,
                logoUrl,
            });
            toast.success('Settings saved');
        } catch (err: any) {
            setSaveError(err.response?.data?.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (error || !organization) {
        return (
            <div className="rounded-2xl bg-rose-50 p-8 text-center ring-1 ring-rose-200">
                <p className="text-rose-600 font-semibold">{error || 'Organization not found'}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Organization Settings</h1>
                <p className="mt-1 text-slate-500">Manage your hospital identity and subscription</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Forms */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="card space-y-6 p-6">
                        <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            General Information
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Hospital Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">URL Slug</label>
                                <div className="flex">
                                    <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm text-slate-500">
                                        aarogentix.com/
                                    </span>
                                    <input
                                        type="text"
                                        disabled
                                        contentEditable={false}
                                        defaultValue={organization.slug}
                                        className="w-full rounded-r-xl border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Logo (URL)</label>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 rounded-xl border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                                <button className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200">
                                    <ImageIcon className="h-4 w-4" />
                                    Preview
                                </button>
                            </div>
                        </div>

                        {saveError && (
                            <p className="text-sm text-rose-600 font-medium">{saveError}</p>
                        )}

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </section>

                    <section className="card p-6 border-l-4 border-amber-400 bg-amber-50/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <Crown className="h-5 w-5 text-amber-500" />
                                Current Subscription
                            </div>
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                                {plan} Plan
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                            Your organization is currently on the <span className="font-bold text-slate-900 capitalize">{plan}</span> plan.
                            {plan === 'basic' && ' Upgrade to access Radiology, Advanced Staff Management, and more.'}
                        </p>
                        <button className="mt-4 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md">
                            View All Plans
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </section>
                </div>

                {/* Right Column: Info Cards */}
                <div className="space-y-6">
                    <div className="card p-6 bg-slate-900 text-white border-0 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 -m-8 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl"></div>
                        <div className="relative">
                            <ShieldCheck className="h-8 w-8 text-blue-400 mb-4" />
                            <h3 className="font-bold text-lg">Trust & Security</h3>
                            <p className="text-slate-400 text-sm mt-1 mb-4">Aarogentix ensures all organization data is encrypted and isolated according to HIPAA standards.</p>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                                Security Managed
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 space-y-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Globe className="h-5 w-5 text-blue-600" />
                            Public Identity
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clinic Portal URL</p>
                            <p className="text-xs font-mono text-blue-600 truncate">https://{organization.slug}.aarogentix.com</p>
                        </div>
                        <p className="text-xs text-slate-500">This URL is where your staff and patients will access your hospital portal.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
