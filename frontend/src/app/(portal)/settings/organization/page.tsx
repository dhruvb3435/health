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
  ChevronRight,
  MapPin,
  Clock,
} from 'lucide-react';

export default function OrganizationSettingsPage() {
  useRequireRole('admin', 'super_admin', 'owner');
  const { organization, isLoading, error } = useOrganization();
  const { plan } = useSubscription();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // General
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Working Hours
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setLogoUrl(organization.logoUrl || '');
      const settings = (organization.settings || {}) as Record<string, any>;
      setContactEmail(settings.contactEmail || '');
      setContactPhone(settings.contactPhone || '');
      setStreet(settings.street || '');
      setCity(settings.city || '');
      setState(settings.state || '');
      setCountry(settings.country || '');
      setPostalCode(settings.postalCode || '');
      setWorkingHoursStart(settings.workingHoursStart || '09:00');
      setWorkingHoursEnd(settings.workingHoursEnd || '18:00');
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
        settings: {
          ...(organization.settings || {}),
          contactEmail,
          contactPhone,
          street,
          city,
          state,
          country,
          postalCode,
          workingHoursStart,
          workingHoursEnd,
        },
      });
      toast.success('Settings saved successfully');
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Organization Settings</h1>
        <p className="mt-1 text-sm md:text-base text-slate-500">Manage your hospital identity, address, and working hours</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <section className="card space-y-6 p-6">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Building2 className="h-5 w-5 text-blue-600" />
              General Information
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Hospital Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input h-11 w-full"
                  placeholder="e.g. City General Hospital"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">URL Slug</label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm text-slate-500">
                    aarogentix.com/
                  </span>
                  <input
                    type="text"
                    disabled
                    defaultValue={organization.slug}
                    className="input h-11 w-full rounded-l-none bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Logo (URL)</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="input h-11 flex-1"
                />
                {logoUrl && (
                  <div className="h-11 w-11 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                {!logoUrl && (
                  <div className="h-11 w-11 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                    <ImageIcon className="h-5 w-5 text-slate-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="input h-11 w-full"
                  placeholder="info@hospital.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="input h-11 w-full"
                  placeholder="+91 1234567890"
                />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="card space-y-6 p-6">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <MapPin className="h-5 w-5 text-blue-600" />
              Address
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Street Address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="input h-11 w-full"
                  placeholder="123 Medical Drive"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input h-11 w-full"
                    placeholder="e.g. Jaipur"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input h-11 w-full"
                    placeholder="e.g. Rajasthan"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="input h-11 w-full"
                    placeholder="e.g. India"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="input h-11 w-full"
                    placeholder="e.g. 302001"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Working Hours */}
          <section className="card space-y-6 p-6">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Clock className="h-5 w-5 text-blue-600" />
              Working Hours
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Start Time</label>
                <input
                  type="time"
                  value={workingHoursStart}
                  onChange={(e) => setWorkingHoursStart(e.target.value)}
                  className="input h-11 w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">End Time</label>
                <input
                  type="time"
                  value={workingHoursEnd}
                  onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  className="input h-11 w-full"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              These hours define your organization&apos;s standard working schedule.
            </p>
          </section>

          {/* Save Button + Error */}
          {saveError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
              <p className="text-sm text-rose-600 font-medium">{saveError}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Subscription Card */}
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

          {/* Quick Location Summary */}
          {(city || state || country) && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <MapPin className="h-5 w-5 text-blue-600" />
                Location
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-700">
                  {[street, city, state, postalCode, country].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
