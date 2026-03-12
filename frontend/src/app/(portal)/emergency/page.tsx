'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
    Siren,
    Search,
    Plus,
    Clock,
    User,
    X,
    AlertTriangle,
    Activity,
    Ambulance,
    Footprints,
    ShieldAlert,
    Check,
    ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

type TriageLevel = 'level_1_resuscitation' | 'level_2_emergency' | 'level_3_urgent' | 'level_4_semi_urgent' | 'level_5_non_urgent';
type CaseStatus = 'registered' | 'triaged' | 'in_treatment' | 'admitted' | 'discharged' | 'transferred' | 'deceased';
type ArrivalMode = 'walk_in' | 'ambulance' | 'police' | 'referral';

interface EmergencyCase {
    id: string;
    caseNumber: string;
    patientId?: string;
    patient?: { user?: { firstName?: string; lastName?: string }; patientId?: string };
    doctorId?: string;
    doctor?: { user?: { firstName?: string; lastName?: string } };
    triageLevel?: TriageLevel;
    status: CaseStatus;
    arrivalMode: ArrivalMode;
    chiefComplaint: string;
    vitals?: { bp?: string; pulse?: number; temperature?: number; spO2?: number; respiratoryRate?: number; gcs?: number };
    injuryType?: string;
    treatmentNotes?: string;
    disposition?: string;
    arrivalTime: string;
    triageTime?: string;
    treatmentStartTime?: string;
    dispositionTime?: string;
    createdAt: string;
}

interface EmergencyStats {
    total: number;
    byTriageLevel: Record<string, number>;
    byStatus: Record<string, number>;
}

const TRIAGE_CONFIG: Record<TriageLevel, { label: string; color: string; bgColor: string; borderColor: string }> = {
    level_1_resuscitation: { label: 'Resuscitation', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-l-red-600' },
    level_2_emergency: { label: 'Emergency', color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-l-orange-500' },
    level_3_urgent: { label: 'Urgent', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-500' },
    level_4_semi_urgent: { label: 'Semi-Urgent', color: 'text-sky-700', bgColor: 'bg-sky-100', borderColor: 'border-l-sky-500' },
    level_5_non_urgent: { label: 'Non-Urgent', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-l-emerald-500' },
};

const STATUS_CONFIG: Record<CaseStatus, { label: string; badge: string }> = {
    registered: { label: 'Registered', badge: 'badge-warning' },
    triaged: { label: 'Triaged', badge: 'badge-primary' },
    in_treatment: { label: 'In Treatment', badge: 'badge-primary animate-pulse' },
    admitted: { label: 'Admitted', badge: 'badge-success' },
    discharged: { label: 'Discharged', badge: 'badge-success' },
    transferred: { label: 'Transferred', badge: 'badge-warning' },
    deceased: { label: 'Deceased', badge: 'badge-error' },
};

const ARRIVAL_ICONS: Record<ArrivalMode, { label: string; icon: typeof Ambulance }> = {
    walk_in: { label: 'Walk-in', icon: Footprints },
    ambulance: { label: 'Ambulance', icon: Ambulance },
    police: { label: 'Police', icon: ShieldAlert },
    referral: { label: 'Referral', icon: ArrowRight },
};

export default function EmergencyPage() {
    const [cases, setCases] = useState<EmergencyCase[]>([]);
    const [stats, setStats] = useState<EmergencyStats>({ total: 0, byTriageLevel: {}, byStatus: {} });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        chiefComplaint: '',
        arrivalMode: 'walk_in' as ArrivalMode,
        patientId: '',
        triageLevel: '' as TriageLevel | '',
        injuryType: '',
        allergies: '',
        vitals: { bp: '', pulse: '', temperature: '', spO2: '', respiratoryRate: '', gcs: '' },
    });

    const fetchCases = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (statusFilter) params.status = statusFilter;
            const res = await apiClient.get('/emergency', { params });
            setCases(res.data.data || res.data || []);
            if (res.data.stats) setStats(res.data.stats);
        } catch {
            // handled by global interceptor
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await apiClient.get('/emergency/stats');
            setStats(res.data);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        fetchCases();
        fetchStats();
    }, [fetchCases, fetchStats]);

    // Auto-refresh every 15 seconds for emergency
    useEffect(() => {
        const interval = setInterval(() => {
            fetchCases();
            fetchStats();
        }, 15000);
        return () => clearInterval(interval);
    }, [fetchCases, fetchStats]);

    const handleRegister = async () => {
        if (!formData.chiefComplaint) {
            toast.error('Chief complaint is required');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload: any = {
                chiefComplaint: formData.chiefComplaint,
                arrivalMode: formData.arrivalMode,
                injuryType: formData.injuryType || undefined,
                allergies: formData.allergies || undefined,
            };
            if (formData.patientId) payload.patientId = formData.patientId;
            if (formData.triageLevel) payload.triageLevel = formData.triageLevel;
            const vitals: any = {};
            if (formData.vitals.bp) vitals.bp = formData.vitals.bp;
            if (formData.vitals.pulse) vitals.pulse = Number(formData.vitals.pulse);
            if (formData.vitals.temperature) vitals.temperature = Number(formData.vitals.temperature);
            if (formData.vitals.spO2) vitals.spO2 = Number(formData.vitals.spO2);
            if (formData.vitals.respiratoryRate) vitals.respiratoryRate = Number(formData.vitals.respiratoryRate);
            if (formData.vitals.gcs) vitals.gcs = Number(formData.vitals.gcs);
            if (Object.keys(vitals).length > 0) payload.vitals = vitals;

            await apiClient.post('/emergency', payload);
            toast.success('Emergency case registered');
            setShowRegisterModal(false);
            setFormData({
                chiefComplaint: '', arrivalMode: 'walk_in', patientId: '', triageLevel: '',
                injuryType: '', allergies: '',
                vitals: { bp: '', pulse: '', temperature: '', spO2: '', respiratoryRate: '', gcs: '' },
            });
            fetchCases();
            fetchStats();
        } catch {
            // handled by global interceptor
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (id: string, status: CaseStatus) => {
        try {
            await apiClient.patch(`/emergency/${id}/status`, { status });
            toast.success(`Status updated to ${STATUS_CONFIG[status]?.label || status}`);
            fetchCases();
            fetchStats();
        } catch {
            // handled by global interceptor
        }
    };

    const filteredCases = cases.filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return [
            c.caseNumber,
            c.chiefComplaint,
            c.patient?.user?.firstName,
            c.patient?.user?.lastName,
            c.injuryType,
        ].some(v => v?.toLowerCase().includes(q));
    });

    const getElapsedTime = (arrivalTime: string) => {
        const mins = Math.floor((Date.now() - new Date(arrivalTime).getTime()) / 60000);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        return `${hrs}h ${mins % 60}m`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Emergency Department</h1>
                    <p className="mt-1 text-sm md:text-base text-slate-500">Real-time emergency triage and case management</p>
                </div>
                <button onClick={() => setShowRegisterModal(true)} className="btn btn-danger h-11 gap-2 font-bold">
                    <Siren size={18} />
                    Register Emergency
                </button>
            </div>

            {/* Triage Level Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(Object.entries(TRIAGE_CONFIG) as [TriageLevel, typeof TRIAGE_CONFIG[TriageLevel]][]).map(([level, cfg]) => (
                    <div key={level} className={`card bg-white border-slate-200 shadow-sm p-4 border-l-4 ${cfg.borderColor}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats.byTriageLevel?.[level] || 0}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by case #, complaint, patient..."
                        className="input pl-10 h-11"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select className="input h-11 text-sm sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">Active Cases</option>
                    <option value="registered">Registered</option>
                    <option value="triaged">Triaged</option>
                    <option value="in_treatment">In Treatment</option>
                    <option value="admitted">Admitted</option>
                    <option value="discharged">Discharged</option>
                    <option value="transferred">Transferred</option>
                </select>
            </div>

            {/* Cases Grid */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="card h-48 animate-pulse bg-slate-50 border-slate-100" />
                    ))
                ) : filteredCases.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Activity size={40} />
                        </div>
                        <p className="text-slate-500 font-medium text-lg">No active emergency cases</p>
                        <p className="text-slate-400 text-sm">Register a new case when a patient arrives.</p>
                    </div>
                ) : (
                    filteredCases.map(c => {
                        const triageCfg = c.triageLevel ? TRIAGE_CONFIG[c.triageLevel] : null;
                        const statusCfg = STATUS_CONFIG[c.status] || { label: c.status, badge: '' };
                        const arrivalCfg = ARRIVAL_ICONS[c.arrivalMode] || ARRIVAL_ICONS.walk_in;
                        const ArrivalIcon = arrivalCfg.icon;

                        return (
                            <div key={c.id} className={`card bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow ${triageCfg ? `border-l-4 ${triageCfg.borderColor}` : ''}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-slate-900">{c.caseNumber}</span>
                                            <span className={`badge ${statusCfg.badge}`}>{statusCfg.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                            <ArrivalIcon size={12} />
                                            <span>{arrivalCfg.label}</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                                            <Clock size={12} />
                                            <span>{getElapsedTime(c.arrivalTime)} ago</span>
                                        </div>
                                    </div>
                                    {triageCfg && (
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${triageCfg.bgColor} ${triageCfg.color}`}>
                                            <AlertTriangle size={12} />
                                            {triageCfg.label}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700">
                                            {c.patient?.user?.firstName ? `${c.patient.user.firstName} ${c.patient.user.lastName}` : 'Unknown Patient'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600"><span className="font-semibold">Complaint:</span> {c.chiefComplaint}</p>
                                    {c.injuryType && <p className="text-xs text-slate-500"><span className="font-semibold">Type:</span> {c.injuryType}</p>}
                                    {c.vitals && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {c.vitals.bp && <span className="text-xs bg-slate-100 px-2 py-1 rounded font-medium">BP: {c.vitals.bp}</span>}
                                            {c.vitals.pulse && <span className="text-xs bg-slate-100 px-2 py-1 rounded font-medium">Pulse: {c.vitals.pulse}</span>}
                                            {c.vitals.spO2 && <span className="text-xs bg-slate-100 px-2 py-1 rounded font-medium">SpO2: {c.vitals.spO2}%</span>}
                                            {c.vitals.temperature && <span className="text-xs bg-slate-100 px-2 py-1 rounded font-medium">Temp: {c.vitals.temperature}°F</span>}
                                            {c.vitals.gcs && <span className="text-xs bg-slate-100 px-2 py-1 rounded font-medium">GCS: {c.vitals.gcs}</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                    {c.status === 'registered' && (
                                        <button onClick={() => updateStatus(c.id, 'triaged')} className="btn btn-primary h-8 px-3 text-xs gap-1">
                                            <Activity size={14} /> Triage
                                        </button>
                                    )}
                                    {(c.status === 'triaged' || c.status === 'registered') && (
                                        <button onClick={() => updateStatus(c.id, 'in_treatment')} className="btn btn-primary h-8 px-3 text-xs gap-1">
                                            Start Treatment
                                        </button>
                                    )}
                                    {c.status === 'in_treatment' && (
                                        <>
                                            <button onClick={() => updateStatus(c.id, 'admitted')} className="btn btn-success h-8 px-3 text-xs gap-1">
                                                <Check size={14} /> Admit
                                            </button>
                                            <button onClick={() => updateStatus(c.id, 'discharged')} className="btn btn-secondary h-8 px-3 text-xs gap-1">
                                                Discharge
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Register Emergency Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-rose-50">
                            <div>
                                <h2 className="text-xl font-bold text-rose-900">Register Emergency Case</h2>
                                <p className="text-sm text-rose-600">Enter patient details for emergency triage</p>
                            </div>
                            <button onClick={() => setShowRegisterModal(false)} className="p-2 hover:bg-rose-100 rounded-lg text-rose-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Chief Complaint *</label>
                                <textarea
                                    className="input w-full min-h-[80px] py-3"
                                    placeholder="e.g., Chest pain, shortness of breath since 2 hours"
                                    value={formData.chiefComplaint}
                                    onChange={e => setFormData(f => ({ ...f, chiefComplaint: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Arrival Mode *</label>
                                    <select className="input h-11 w-full" value={formData.arrivalMode} onChange={e => setFormData(f => ({ ...f, arrivalMode: e.target.value as ArrivalMode }))}>
                                        <option value="walk_in">Walk-in</option>
                                        <option value="ambulance">Ambulance</option>
                                        <option value="police">Police</option>
                                        <option value="referral">Referral</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Triage Level</label>
                                    <select className="input h-11 w-full" value={formData.triageLevel} onChange={e => setFormData(f => ({ ...f, triageLevel: e.target.value as TriageLevel }))}>
                                        <option value="">Assign Later</option>
                                        <option value="level_1_resuscitation">Level 1 - Resuscitation</option>
                                        <option value="level_2_emergency">Level 2 - Emergency</option>
                                        <option value="level_3_urgent">Level 3 - Urgent</option>
                                        <option value="level_4_semi_urgent">Level 4 - Semi-Urgent</option>
                                        <option value="level_5_non_urgent">Level 5 - Non-Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Injury Type</label>
                                    <select className="input h-11 w-full" value={formData.injuryType} onChange={e => setFormData(f => ({ ...f, injuryType: e.target.value }))}>
                                        <option value="">Select</option>
                                        <option value="Trauma">Trauma</option>
                                        <option value="Cardiac">Cardiac</option>
                                        <option value="Respiratory">Respiratory</option>
                                        <option value="Neurological">Neurological</option>
                                        <option value="Burns">Burns</option>
                                        <option value="Poisoning">Poisoning</option>
                                        <option value="Obstetric">Obstetric</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Patient ID (if known)</label>
                                    <input className="input h-11 w-full" placeholder="UUID" value={formData.patientId} onChange={e => setFormData(f => ({ ...f, patientId: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Known Allergies</label>
                                <input className="input h-11 w-full" placeholder="e.g., Penicillin, NSAIDs" value={formData.allergies} onChange={e => setFormData(f => ({ ...f, allergies: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">Vitals (if available)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">Blood Pressure</label>
                                        <input className="input h-10 w-full text-sm" placeholder="120/80" value={formData.vitals.bp} onChange={e => setFormData(f => ({ ...f, vitals: { ...f.vitals, bp: e.target.value } }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">Pulse (bpm)</label>
                                        <input className="input h-10 w-full text-sm" type="number" placeholder="80" value={formData.vitals.pulse} onChange={e => setFormData(f => ({ ...f, vitals: { ...f.vitals, pulse: e.target.value } }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">SpO2 (%)</label>
                                        <input className="input h-10 w-full text-sm" type="number" placeholder="98" value={formData.vitals.spO2} onChange={e => setFormData(f => ({ ...f, vitals: { ...f.vitals, spO2: e.target.value } }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">Temperature (°F)</label>
                                        <input className="input h-10 w-full text-sm" type="number" step="0.1" placeholder="98.6" value={formData.vitals.temperature} onChange={e => setFormData(f => ({ ...f, vitals: { ...f.vitals, temperature: e.target.value } }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">Resp. Rate</label>
                                        <input className="input h-10 w-full text-sm" type="number" placeholder="16" value={formData.vitals.respiratoryRate} onChange={e => setFormData(f => ({ ...f, vitals: { ...f.vitals, respiratoryRate: e.target.value } }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">GCS Score</label>
                                        <input className="input h-10 w-full text-sm" type="number" min="3" max="15" placeholder="15" value={formData.vitals.gcs} onChange={e => setFormData(f => ({ ...f, vitals: { ...f.vitals, gcs: e.target.value } }))} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                            <button onClick={() => setShowRegisterModal(false)} className="btn btn-secondary h-11 px-6">Cancel</button>
                            <button onClick={handleRegister} disabled={isSubmitting} className="btn btn-danger h-11 px-6 gap-2">
                                {isSubmitting ? 'Registering...' : (
                                    <>
                                        <Siren size={18} />
                                        Register Case
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
