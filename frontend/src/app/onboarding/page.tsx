'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
    Building2, Users, Database, BarChart2, CheckCircle2,
    ChevronRight, ChevronLeft, Loader2, Sparkles,
    Stethoscope, Heart,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
type StepKey = 'profile' | 'team' | 'demo' | 'modules' | 'complete';
interface StepDef {
    key: StepKey;
    label: string;
    icon: React.ElementType;
    description: string;
}

const STEPS: StepDef[] = [
    { key: 'profile', label: 'Your Organization', icon: Building2, description: 'Set up your hospital profile' },
    { key: 'team', label: 'Invite Team', icon: Users, description: 'Add your first staff members' },
    { key: 'demo', label: 'Sample Data', icon: Database, description: 'Load demo patients & records' },
    { key: 'modules', label: 'Enable Modules', icon: BarChart2, description: 'Choose your features' },
    { key: 'complete', label: 'All Done!', icon: CheckCircle2, description: 'Your workspace is ready' },
];

// ── Step Indicator ─────────────────────────────────────────────────────
function StepIndicator({ currentStep, completedSteps }: { currentStep: number; completedSteps: string[] }) {
    return (
        <div className="flex items-center gap-0">
            {STEPS.map((step, idx) => {
                const num = idx + 1;
                const isCompleted = completedSteps.includes(step.key);
                const isActive = currentStep === num;
                const isDone = num < currentStep || isCompleted;
                const Icon = step.icon;

                return (
                    <div key={step.key} className="flex items-center">
                        <div className="flex flex-col items-center gap-1.5">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${isDone
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : isActive
                                        ? 'border-blue-600 bg-white text-blue-600'
                                        : 'border-slate-200 bg-white text-slate-400'
                                    }`}
                            >
                                {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                            </div>
                            <span className={`hidden sm:block text-[10px] font-semibold whitespace-nowrap ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={`h-0.5 w-6 sm:w-16 mx-0.5 sm:mx-1 mb-4 transition-all duration-500 ${isDone ? 'bg-blue-500' : 'bg-slate-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Step 1: Profile ────────────────────────────────────────────────────
function ProfileStep({ onNext }: { onNext: (data: any) => void }) {
    const [form, setForm] = useState({ name: '', phone: '', address: '', specialties: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.put('/onboarding/progress', { step: 'profile', metadata: form });
            onNext(form);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="label">Hospital / Clinic Name *</label>
                <input
                    className="input"
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. City General Hospital"
                />
            </div>
            <div>
                <label className="label">Contact Phone</label>
                <input
                    className="input"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91-98765-43210"
                />
            </div>
            <div>
                <label className="label">Address</label>
                <textarea
                    className="input resize-none"
                    rows={2}
                    value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="123 Healthcare Ave, Mumbai, Maharashtra"
                />
            </div>
            <div>
                <label className="label">Primary Specialties</label>
                <input
                    className="input"
                    value={form.specialties}
                    onChange={e => setForm(p => ({ ...p, specialties: e.target.value }))}
                    placeholder="e.g. Cardiology, Pediatrics, General Medicine"
                />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save & Continue <ChevronRight className="h-4 w-4" />
            </button>
        </form>
    );
}

// ── Step 2: Team ───────────────────────────────────────────────────────
function TeamStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        setLoading(true);
        try {
            await apiClient.put('/onboarding/progress', { step: 'team', metadata: { teamSetupSeen: true } });
            onNext();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border border-blue-100">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Stethoscope className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Add Doctors & Staff</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Navigate to <strong>Staff</strong> or <strong>Doctors</strong> sections to invite team members.
                            Each member gets a secure login with role-based access.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {[
                    { label: 'Admin', desc: 'Full system access', color: 'purple' },
                    { label: 'Doctor', desc: 'Patient & prescriptions', color: 'blue' },
                    { label: 'Nurse', desc: 'Ward & patient care', color: 'green' },
                    { label: 'Receptionist', desc: 'Appointments & queue', color: 'orange' },
                ].map(role => (
                    <div key={role.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="font-semibold text-slate-800 text-sm">{role.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{role.desc}</p>
                    </div>
                ))}
            </div>

            <p className="text-sm text-slate-500 italic">
                💡 You can always invite team members later from the Staff section.
            </p>

            <div className="flex gap-3">
                <button onClick={onSkip} className="btn-outline flex-1">Skip for now</button>
                <button onClick={handleNext} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Got it! Continue <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

// ── Step 3: Demo Data ──────────────────────────────────────────────────
function DemoStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.post('/onboarding/generate-demo');
            setResult(res.data.created);
            // Mark demo step as complete in backend so it can't be re-run
            await apiClient.put('/onboarding/progress', { step: 'demo', metadata: { demoGenerated: true } }).catch(() => {});
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate demo data. You may already have data.');
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        return (
            <div className="space-y-5">
                <div className="rounded-2xl bg-green-50 border border-green-100 p-6 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-bold text-green-900 text-lg">Demo data loaded! 🎉</h3>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {Object.entries(result).map(([key, val]: [string, any]) => (
                            <div key={key} className="rounded-xl bg-white border border-green-100 p-3">
                                <p className="text-2xl font-bold text-green-700">{val}</p>
                                <p className="text-xs text-slate-500 capitalize">{key}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={onNext} className="btn-primary w-full flex items-center justify-center gap-2">
                    Continue <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                        <Database className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Load Sample Data</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            We'll add realistic demo records so your dashboard looks great from day one.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {[
                    { count: '3', label: 'Demo Doctors' },
                    { count: '10', label: 'Sample Patients' },
                    { count: '8', label: 'Appointments' },
                    { count: '5', label: 'Inventory Items' },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <span className="text-2xl font-bold text-blue-600">{item.count}</span>
                        <span className="text-slate-600">{item.label}</span>
                    </div>
                ))}
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}

            <div className="flex gap-3">
                <button onClick={onSkip} className="btn-outline flex-1">Skip</button>
                <button onClick={handleGenerate} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Load Demo Data</>}
                </button>
            </div>
        </div>
    );
}

// ── Step 4: Modules ────────────────────────────────────────────────────
function ModulesStep({ onNext }: { onNext: () => void }) {
    const [loading, setLoading] = useState(false);

    const modules = [
        { name: 'OPD & Appointments', icon: '🏥', active: true },
        { name: 'IPD & Ward Management', icon: '🛏️', active: true },
        { name: 'Laboratory', icon: '🔬', active: true },
        { name: 'Pharmacy', icon: '💊', active: true },
        { name: 'Billing & Accounts', icon: '💰', active: true },
        { name: 'Inventory', icon: '📦', active: true },
    ];

    const handleNext = async () => {
        setLoading(true);
        try {
            await apiClient.put('/onboarding/progress', { step: 'modules', metadata: { moduleSetupSeen: true } });
            onNext();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <p className="text-sm text-slate-600">
                All modules below are enabled based on your subscription. Upgrade anytime to unlock more.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {modules.map(mod => (
                    <div key={mod.name} className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50/50 p-3">
                        <span className="text-xl">{mod.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{mod.name}</p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    </div>
                ))}
            </div>

            <button onClick={handleNext} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                All set! Continue <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

// ── Step 5: Complete ───────────────────────────────────────────────────
function CompleteStep({ onFinish }: { onFinish: () => void }) {
    const [loading, setLoading] = useState(false);

    const handleFinish = async () => {
        setLoading(true);
        try {
            await apiClient.post('/onboarding/complete');
            onFinish();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 text-center">
            <div className="flex justify-center">
                <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-200">
                        <Heart className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 shadow-lg">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-bold text-slate-900">You're all set! 🎉</h3>
                <p className="mt-2 text-slate-600">
                    Your Aarogentix workspace is ready. Let's build a healthier tomorrow together.
                </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 text-left space-y-2">
                <p className="font-bold text-slate-800 text-sm mb-3">What's next:</p>
                {[
                    '📋 Add your first real patient',
                    '👨‍⚕️ Schedule an appointment',
                    '🏥 Set up your wards & beds',
                    '💊 Configure pharmacy inventory',
                ].map(tip => (
                    <p key={tip} className="text-sm text-slate-600">{tip}</p>
                ))}
            </div>

            <button onClick={handleFinish} disabled={loading} className="btn-primary w-full text-base py-3 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Go to Dashboard →
            </button>
        </div>
    );
}

// ── Main Wizard ────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProgress = useCallback(async () => {
        try {
            const res = await apiClient.get('/onboarding/progress');
            setCurrentStep(res.data.currentStep || 1);
            setCompletedSteps(res.data.completedSteps || []);
            if (res.data.isCompleted) {
                router.replace('/dashboard');
            }
        } catch {
            // If progress fetch fails, start from step 1
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchProgress(); }, [fetchProgress]);

    const goNext = () => setCurrentStep(s => Math.min(s + 1, 5));
    const goPrev = () => setCurrentStep(s => Math.max(s - 1, 1));
    const markComplete = (step: string) => {
        setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step]);
        goNext();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                    <p className="text-sm text-slate-500 font-medium">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    const currentStepDef = STEPS[currentStep - 1];

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
                    <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-slate-900">Aarogentix</span>
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

            {/* Card */}
            <div className="mt-8 w-full max-w-lg">
                <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/60 border border-white/60 p-5 sm:p-8">
                    {/* Step header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 uppercase tracking-wider">
                                Step {currentStep} of {STEPS.length}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{currentStepDef.label}</h2>
                        <p className="mt-1 text-sm text-slate-500">{currentStepDef.description}</p>
                    </div>

                    {/* Step Content */}
                    {currentStep === 1 && <ProfileStep onNext={() => { setCompletedSteps(p => [...new Set([...p, 'profile'])]); goNext(); }} />}
                    {currentStep === 2 && (
                        <TeamStep
                            onNext={() => markComplete('team')}
                            onSkip={() => { goNext(); }}
                        />
                    )}
                    {currentStep === 3 && (
                        <DemoStep
                            onNext={() => markComplete('demo')}
                            onSkip={() => { goNext(); }}
                        />
                    )}
                    {currentStep === 4 && (
                        <ModulesStep onNext={() => markComplete('modules')} />
                    )}
                    {currentStep === 5 && (
                        <CompleteStep onFinish={() => router.replace('/dashboard')} />
                    )}

                    {/* Back button (steps 2-4) */}
                    {currentStep > 1 && currentStep < 5 && (
                        <button onClick={goPrev} className="mt-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                            <ChevronLeft className="h-4 w-4" /> Back
                        </button>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    You can always skip and complete setup later from Settings.
                </p>
            </div>
        </div>
    );
}
