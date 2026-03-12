'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
    FileText, Plus, X, Search, Clock, CheckCircle2, FileCheck, Send,
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';

type DischargeStatus = 'draft' | 'pending_approval' | 'approved' | 'completed';
type DischargeType = 'normal' | 'against_advice' | 'absconded' | 'referred' | 'expired';

interface DischargeSummary {
    id: string;
    summaryNumber: string;
    patient?: { user?: { firstName?: string; lastName?: string }; patientId?: string };
    doctor?: { user?: { firstName?: string; lastName?: string }; specialization?: string };
    admissionDate: string;
    dischargeDate: string;
    dischargeType: DischargeType;
    status: DischargeStatus;
    diagnosisAtAdmission: string;
    diagnosisAtDischarge?: string;
    conditionAtDischarge?: string;
    createdAt: string;
}

interface SummaryStats {
    [key: string]: number;
}

const STATUS_CONFIG: Record<DischargeStatus, { label: string; badge: string; icon: any }> = {
    draft: { label: 'Draft', badge: 'bg-slate-100 text-slate-600', icon: FileText },
    pending_approval: { label: 'Pending Approval', badge: 'badge-warning', icon: Clock },
    approved: { label: 'Approved', badge: 'badge-success', icon: CheckCircle2 },
    completed: { label: 'Completed', badge: 'bg-emerald-100 text-emerald-700', icon: FileCheck },
};

const DISCHARGE_TYPE_LABEL: Record<DischargeType, string> = {
    normal: 'Normal',
    against_advice: 'Against Medical Advice',
    absconded: 'Absconded',
    referred: 'Referred',
    expired: 'Expired',
};

export default function DischargeSummaryPage() {
    const [summaries, setSummaries] = useState<DischargeSummary[]>([]);
    const [stats, setStats] = useState<SummaryStats>({});
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState<DischargeSummary | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        patientId: '', doctorId: '', admissionDate: '', dischargeDate: '',
        dischargeType: 'normal' as DischargeType, diagnosisAtAdmission: '',
        diagnosisAtDischarge: '', chiefComplaints: '', treatmentGiven: '',
        conditionAtDischarge: '', followUpDate: '', followUpInstructions: '',
        dietaryAdvice: '', activityRestrictions: '',
    });

    const limit = 15;

    const fetchSummaries = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = { page, limit };
            if (statusFilter) params.status = statusFilter;
            const res = await apiClient.get('/discharge-summaries', { params });
            setSummaries(res.data.data || []);
            setTotalPages(res.data.meta?.totalPages || 1);
            setTotalItems(res.data.meta?.total || 0);
        } catch {} finally { setIsLoading(false); }
    }, [page, statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await apiClient.get('/discharge-summaries/stats');
            setStats(res.data || {});
        } catch {}
    }, []);

    useEffect(() => { fetchSummaries(); fetchStats(); }, [fetchSummaries, fetchStats]);

    const handleCreate = async () => {
        if (!form.patientId || !form.doctorId || !form.admissionDate || !form.dischargeDate || !form.diagnosisAtAdmission) {
            toast.error('Patient, doctor, dates, and admission diagnosis required');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/discharge-summaries', form);
            toast.success('Discharge summary created');
            setShowCreateModal(false);
            resetForm();
            fetchSummaries(); fetchStats();
        } catch {} finally { setIsSubmitting(false); }
    };

    const updateStatus = async (id: string, status: DischargeStatus) => {
        try {
            await apiClient.patch(`/discharge-summaries/${id}/status`, { status });
            toast.success(`Summary ${STATUS_CONFIG[status]?.label || status}`);
            fetchSummaries(); fetchStats();
        } catch {}
    };

    const viewDetail = async (id: string) => {
        try {
            const res = await apiClient.get(`/discharge-summaries/${id}`);
            setSelectedSummary(res.data);
            setShowDetailModal(true);
        } catch { toast.error('Failed to load summary'); }
    };

    const resetForm = () => setForm({
        patientId: '', doctorId: '', admissionDate: '', dischargeDate: '',
        dischargeType: 'normal', diagnosisAtAdmission: '', diagnosisAtDischarge: '',
        chiefComplaints: '', treatmentGiven: '', conditionAtDischarge: '',
        followUpDate: '', followUpInstructions: '', dietaryAdvice: '', activityRestrictions: '',
    });

    const draftCount = stats.draft || 0;
    const pendingCount = stats.pending_approval || 0;
    const approvedCount = stats.approved || 0;
    const completedCount = stats.completed || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Discharge Summary</h1>
                    <p className="mt-1 text-sm md:text-base text-slate-500">Manage patient discharge documentation</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary h-10 gap-2">
                    <Plus size={18} /> New Summary
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card bg-white border-slate-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Draft</p>
                    <p className="text-2xl font-bold text-slate-600 mt-1">{draftCount}</p>
                </div>
                <div className="card bg-white border-amber-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Pending</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
                </div>
                <div className="card bg-white border-emerald-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Approved</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
                </div>
                <div className="card bg-white border-indigo-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Completed</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{completedCount}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex justify-end">
                <select className="input h-10 text-sm sm:w-48" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="card overflow-hidden !p-0 shadow-sm border-slate-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Summary #</th>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                                <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                                <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</th>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-4 sm:px-6 py-4"><div className="h-6 w-28 bg-slate-100 rounded" /></td>
                                    <td className="px-4 sm:px-6 py-4"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                                    <td className="hidden sm:table-cell px-6 py-4"><div className="h-6 w-28 bg-slate-100 rounded" /></td>
                                    <td className="hidden md:table-cell px-6 py-4"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                                    <td className="px-4 sm:px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded" /></td>
                                    <td className="px-4 sm:px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded float-right" /></td>
                                </tr>
                            )) : summaries.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center">
                                    <FileText size={40} className="mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-500 font-medium">No discharge summaries</p>
                                </td></tr>
                            ) : summaries.map(s => {
                                const stCfg = STATUS_CONFIG[s.status] || { label: s.status, badge: '', icon: FileText };
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => viewDetail(s.id)}>
                                        <td className="px-4 sm:px-6 py-4">
                                            <p className="font-mono font-bold text-sm text-slate-900">{s.summaryNumber}</p>
                                            <p className="text-xs text-slate-400 capitalize">{DISCHARGE_TYPE_LABEL[s.dischargeType]}</p>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <p className="font-bold text-sm text-slate-900">{s.patient?.user?.firstName} {s.patient?.user?.lastName}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[150px]">{s.diagnosisAtAdmission}</p>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-4">
                                            <p className="text-sm text-slate-700">Dr. {s.doctor?.user?.firstName} {s.doctor?.user?.lastName}</p>
                                            <p className="text-xs text-slate-400">{s.doctor?.specialization}</p>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4">
                                            <p className="text-sm text-slate-600">{new Date(s.admissionDate).toLocaleDateString()}</p>
                                            <p className="text-xs text-slate-400">to {new Date(s.dischargeDate).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${stCfg.badge}`}>{stCfg.label}</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {s.status === 'draft' && (
                                                    <button onClick={() => updateStatus(s.id, 'pending_approval')} className="btn btn-primary h-8 px-3 text-xs gap-1">
                                                        <Send size={12} /> Submit
                                                    </button>
                                                )}
                                                {s.status === 'approved' && (
                                                    <button onClick={() => updateStatus(s.id, 'completed')} className="btn btn-success h-8 px-3 text-xs gap-1">
                                                        <FileCheck size={12} /> Complete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {!isLoading && totalPages > 1 && (
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={totalItems} limit={limit} />
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">New Discharge Summary</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Patient ID *</label>
                                    <input className="input h-11 w-full" placeholder="UUID" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Doctor ID *</label>
                                    <input className="input h-11 w-full" placeholder="UUID" value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))} /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Admission Date *</label>
                                    <input type="date" className="input h-11 w-full" value={form.admissionDate} onChange={e => setForm(f => ({ ...f, admissionDate: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Discharge Date *</label>
                                    <input type="date" className="input h-11 w-full" value={form.dischargeDate} onChange={e => setForm(f => ({ ...f, dischargeDate: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Discharge Type</label>
                                    <select className="input h-11 w-full" value={form.dischargeType} onChange={e => setForm(f => ({ ...f, dischargeType: e.target.value as DischargeType }))}>
                                        {Object.entries(DISCHARGE_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select></div>
                            </div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Diagnosis at Admission *</label>
                                <textarea className="input w-full min-h-[70px] py-3" value={form.diagnosisAtAdmission} onChange={e => setForm(f => ({ ...f, diagnosisAtAdmission: e.target.value }))} /></div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Diagnosis at Discharge</label>
                                <textarea className="input w-full min-h-[70px] py-3" value={form.diagnosisAtDischarge} onChange={e => setForm(f => ({ ...f, diagnosisAtDischarge: e.target.value }))} /></div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Chief Complaints</label>
                                <input className="input h-11 w-full" value={form.chiefComplaints} onChange={e => setForm(f => ({ ...f, chiefComplaints: e.target.value }))} /></div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Treatment Given</label>
                                <textarea className="input w-full min-h-[70px] py-3" value={form.treatmentGiven} onChange={e => setForm(f => ({ ...f, treatmentGiven: e.target.value }))} /></div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Condition at Discharge</label>
                                <input className="input h-11 w-full" value={form.conditionAtDischarge} onChange={e => setForm(f => ({ ...f, conditionAtDischarge: e.target.value }))} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Follow-up Date</label>
                                    <input type="date" className="input h-11 w-full" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Follow-up Instructions</label>
                                    <input className="input h-11 w-full" value={form.followUpInstructions} onChange={e => setForm(f => ({ ...f, followUpInstructions: e.target.value }))} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Dietary Advice</label>
                                    <input className="input h-11 w-full" value={form.dietaryAdvice} onChange={e => setForm(f => ({ ...f, dietaryAdvice: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Activity Restrictions</label>
                                    <input className="input h-11 w-full" value={form.activityRestrictions} onChange={e => setForm(f => ({ ...f, activityRestrictions: e.target.value }))} /></div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                            <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary h-11 px-6">Cancel</button>
                            <button onClick={handleCreate} disabled={isSubmitting} className="btn btn-primary h-11 px-6">{isSubmitting ? 'Creating...' : 'Create Summary'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedSummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{selectedSummary.summaryNumber}</h2>
                                <p className="text-sm text-slate-500">Discharge Summary Detail</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Patient</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{selectedSummary.patient?.user?.firstName} {selectedSummary.patient?.user?.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Doctor</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">Dr. {selectedSummary.doctor?.user?.firstName} {selectedSummary.doctor?.user?.lastName}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Admission</p>
                                    <p className="text-sm text-slate-700 mt-1">{new Date(selectedSummary.admissionDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Discharge</p>
                                    <p className="text-sm text-slate-700 mt-1">{new Date(selectedSummary.dischargeDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Type</p>
                                    <p className="text-sm text-slate-700 mt-1 capitalize">{DISCHARGE_TYPE_LABEL[selectedSummary.dischargeType]}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${STATUS_CONFIG[selectedSummary.status]?.badge}`}>
                                    {STATUS_CONFIG[selectedSummary.status]?.label}
                                </span>
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Diagnosis at Admission</p>
                                <p className="text-sm text-slate-700">{selectedSummary.diagnosisAtAdmission}</p>
                            </div>
                            {selectedSummary.diagnosisAtDischarge && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Diagnosis at Discharge</p>
                                    <p className="text-sm text-slate-700">{selectedSummary.diagnosisAtDischarge}</p>
                                </div>
                            )}
                            {selectedSummary.conditionAtDischarge && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Condition at Discharge</p>
                                    <p className="text-sm text-slate-700">{selectedSummary.conditionAtDischarge}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                            <button onClick={() => setShowDetailModal(false)} className="btn btn-secondary h-11 px-6">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
