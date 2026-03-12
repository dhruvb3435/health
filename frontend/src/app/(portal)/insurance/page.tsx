'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
    ShieldCheck, Search, Plus, X, FileText, Building2, Check, Clock, AlertTriangle, IndianRupee,
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';

type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'query_raised' | 'approved' | 'partially_approved' | 'rejected' | 'settled' | 'cancelled';
type TreatmentType = 'cashless' | 'reimbursement';

interface InsuranceProvider {
    id: string;
    providerName: string;
    providerCode: string;
    contactPerson?: string;
    contactPhone?: string;
    isActive: boolean;
}

interface InsuranceClaim {
    id: string;
    claimNumber: string;
    patient?: { user?: { firstName?: string; lastName?: string }; patientId?: string };
    provider?: InsuranceProvider;
    policyNumber: string;
    treatmentType: TreatmentType;
    claimAmount: number;
    approvedAmount: number;
    settledAmount: number;
    status: ClaimStatus;
    diagnosisDescription: string;
    submittedDate?: string;
    createdAt: string;
}

interface ClaimStats {
    [key: string]: number;
}

const STATUS_CONFIG: Record<ClaimStatus, { label: string; badge: string }> = {
    draft: { label: 'Draft', badge: 'bg-slate-100 text-slate-600' },
    submitted: { label: 'Submitted', badge: 'badge-primary' },
    under_review: { label: 'Under Review', badge: 'badge-warning' },
    query_raised: { label: 'Query Raised', badge: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', badge: 'badge-success' },
    partially_approved: { label: 'Partially Approved', badge: 'bg-sky-100 text-sky-700' },
    rejected: { label: 'Rejected', badge: 'badge-error' },
    settled: { label: 'Settled', badge: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Cancelled', badge: 'bg-slate-100 text-slate-500' },
};

export default function InsurancePage() {
    const [activeTab, setActiveTab] = useState<'claims' | 'providers'>('claims');
    const [claims, setClaims] = useState<InsuranceClaim[]>([]);
    const [providers, setProviders] = useState<InsuranceProvider[]>([]);
    const [stats, setStats] = useState<ClaimStats>({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [claimForm, setClaimForm] = useState({
        patientId: '', doctorId: '', providerId: '', policyNumber: '', policyHolderName: '',
        treatmentType: 'cashless' as TreatmentType, claimAmount: 0, diagnosisDescription: '',
        admissionDate: '', dischargeDate: '',
    });

    const [providerForm, setProviderForm] = useState({
        providerName: '', providerCode: '', contactPerson: '', contactPhone: '', contactEmail: '',
    });

    const limit = 15;

    const fetchClaims = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = { page, limit };
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;
            const res = await apiClient.get('/insurance/claims', { params });
            setClaims(res.data.data || []);
            setTotalPages(res.data.meta?.totalPages || 1);
            setTotalItems(res.data.meta?.total || 0);
        } catch {} finally { setIsLoading(false); }
    }, [page, statusFilter, search]);

    const fetchProviders = useCallback(async () => {
        try {
            const res = await apiClient.get('/insurance/providers');
            setProviders(res.data.data || res.data || []);
        } catch {}
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const res = await apiClient.get('/insurance/claims/stats');
            setStats(res.data || {});
        } catch {}
    }, []);

    useEffect(() => { fetchClaims(); fetchStats(); }, [fetchClaims, fetchStats]);
    useEffect(() => { fetchProviders(); }, [fetchProviders]);

    const handleCreateClaim = async () => {
        if (!claimForm.patientId || !claimForm.providerId || !claimForm.policyNumber) {
            toast.error('Patient, provider, and policy number required');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/insurance/claims', claimForm);
            toast.success('Claim created');
            setShowClaimModal(false);
            fetchClaims(); fetchStats();
        } catch {} finally { setIsSubmitting(false); }
    };

    const handleCreateProvider = async () => {
        if (!providerForm.providerName || !providerForm.providerCode) {
            toast.error('Provider name and code required');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/insurance/providers', providerForm);
            toast.success('Provider added');
            setShowProviderModal(false);
            setProviderForm({ providerName: '', providerCode: '', contactPerson: '', contactPhone: '', contactEmail: '' });
            fetchProviders();
        } catch {} finally { setIsSubmitting(false); }
    };

    const updateClaimStatus = async (id: string, status: ClaimStatus) => {
        try {
            await apiClient.patch(`/insurance/claims/${id}/status`, { status });
            toast.success(`Claim ${STATUS_CONFIG[status]?.label || status}`);
            fetchClaims(); fetchStats();
        } catch {}
    };

    const totalClaimed = claims.reduce((s, c) => s + (c.claimAmount || 0), 0);
    const totalApproved = claims.reduce((s, c) => s + (c.approvedAmount || 0), 0);
    const totalSettled = claims.reduce((s, c) => s + (c.settledAmount || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Insurance & TPA</h1>
                    <p className="mt-1 text-sm md:text-base text-slate-500">Manage insurance claims and TPA providers</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowProviderModal(true)} className="btn btn-secondary h-10 gap-2">
                        <Building2 size={18} /> Add Provider
                    </button>
                    <button onClick={() => setShowClaimModal(true)} className="btn btn-primary h-10 gap-2">
                        <Plus size={18} /> New Claim
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card bg-white border-slate-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Claimed</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">&#8377;{totalClaimed.toLocaleString()}</p>
                </div>
                <div className="card bg-white border-slate-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Approved</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">&#8377;{totalApproved.toLocaleString()}</p>
                </div>
                <div className="card bg-white border-slate-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Settled</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">&#8377;{totalSettled.toLocaleString()}</p>
                </div>
            </div>

            {/* Tabs + Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('claims')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'claims' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                        <FileText size={16} className="inline mr-2" />Claims
                    </button>
                    <button onClick={() => setActiveTab('providers')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'providers' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                        <Building2 size={16} className="inline mr-2" />Providers ({providers.length})
                    </button>
                </div>
                {activeTab === 'claims' && (
                    <select className="input h-10 text-sm sm:w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">All Statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                )}
            </div>

            {/* Claims Tab */}
            {activeTab === 'claims' && (
                <div className="card overflow-hidden !p-0 shadow-sm border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Claim #</th>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                                    <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                                    <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 sm:px-6 py-4"><div className="h-6 w-28 bg-slate-100 rounded" /></td>
                                        <td className="px-4 sm:px-6 py-4"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                                        <td className="hidden sm:table-cell px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded" /></td>
                                        <td className="hidden md:table-cell px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded" /></td>
                                        <td className="px-4 sm:px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded" /></td>
                                        <td className="px-4 sm:px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded float-right" /></td>
                                    </tr>
                                )) : claims.length === 0 ? (
                                    <tr><td colSpan={6} className="py-20 text-center">
                                        <ShieldCheck size={40} className="mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-500 font-medium">No insurance claims</p>
                                    </td></tr>
                                ) : claims.map(claim => {
                                    const stCfg = STATUS_CONFIG[claim.status] || { label: claim.status, badge: '' };
                                    return (
                                        <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 sm:px-6 py-4">
                                                <p className="font-mono font-bold text-sm text-slate-900">{claim.claimNumber}</p>
                                                <p className="text-xs text-slate-400 capitalize">{claim.treatmentType}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <p className="font-bold text-sm text-slate-900">{claim.patient?.user?.firstName} {claim.patient?.user?.lastName}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-[150px]">{claim.diagnosisDescription}</p>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4 text-sm text-slate-600">{claim.provider?.providerName || '-'}</td>
                                            <td className="hidden md:table-cell px-6 py-4">
                                                <p className="text-sm font-bold text-slate-900">&#8377;{claim.claimAmount?.toLocaleString()}</p>
                                                {claim.approvedAmount > 0 && <p className="text-xs text-emerald-600">Approved: &#8377;{claim.approvedAmount.toLocaleString()}</p>}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${stCfg.badge}`}>{stCfg.label}</span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {claim.status === 'draft' && (
                                                        <button onClick={() => updateClaimStatus(claim.id, 'submitted')} className="btn btn-primary h-8 px-3 text-xs">Submit</button>
                                                    )}
                                                    {claim.status === 'approved' && (
                                                        <button onClick={() => updateClaimStatus(claim.id, 'settled')} className="btn btn-success h-8 px-3 text-xs">Settle</button>
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
            )}

            {/* Providers Tab */}
            {activeTab === 'providers' && (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {providers.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <Building2 size={40} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500 font-medium">No insurance providers</p>
                        </div>
                    ) : providers.map(p => (
                        <div key={p.id} className="card bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{p.providerName}</p>
                                    <p className="text-xs text-slate-400 font-mono">{p.providerCode}</p>
                                </div>
                            </div>
                            {p.contactPerson && <p className="text-sm text-slate-600">Contact: {p.contactPerson}</p>}
                            {p.contactPhone && <p className="text-sm text-slate-500">{p.contactPhone}</p>}
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <span className={`badge ${p.isActive ? 'badge-success' : 'badge-error'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Claim Modal */}
            {showClaimModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">New Insurance Claim</h2>
                            <button onClick={() => setShowClaimModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Patient ID *</label>
                                    <input className="input h-11 w-full" placeholder="UUID" value={claimForm.patientId} onChange={e => setClaimForm(f => ({ ...f, patientId: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Provider *</label>
                                    <select className="input h-11 w-full" value={claimForm.providerId} onChange={e => setClaimForm(f => ({ ...f, providerId: e.target.value }))}>
                                        <option value="">Select</option>
                                        {providers.map(p => <option key={p.id} value={p.id}>{p.providerName}</option>)}
                                    </select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Policy Number *</label>
                                    <input className="input h-11 w-full" value={claimForm.policyNumber} onChange={e => setClaimForm(f => ({ ...f, policyNumber: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Policy Holder Name</label>
                                    <input className="input h-11 w-full" value={claimForm.policyHolderName} onChange={e => setClaimForm(f => ({ ...f, policyHolderName: e.target.value }))} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Treatment Type</label>
                                    <select className="input h-11 w-full" value={claimForm.treatmentType} onChange={e => setClaimForm(f => ({ ...f, treatmentType: e.target.value as TreatmentType }))}>
                                        <option value="cashless">Cashless</option><option value="reimbursement">Reimbursement</option>
                                    </select></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Claim Amount (&#8377;)</label>
                                    <input type="number" className="input h-11 w-full" value={claimForm.claimAmount} onChange={e => setClaimForm(f => ({ ...f, claimAmount: parseFloat(e.target.value) || 0 }))} /></div>
                            </div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Diagnosis *</label>
                                <textarea className="input w-full min-h-[80px] py-3" placeholder="Diagnosis description" value={claimForm.diagnosisDescription} onChange={e => setClaimForm(f => ({ ...f, diagnosisDescription: e.target.value }))} /></div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                            <button onClick={() => setShowClaimModal(false)} className="btn btn-secondary h-11 px-6">Cancel</button>
                            <button onClick={handleCreateClaim} disabled={isSubmitting} className="btn btn-primary h-11 px-6">{isSubmitting ? 'Creating...' : 'Create Claim'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Provider Modal */}
            {showProviderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">Add Insurance Provider</h2>
                            <button onClick={() => setShowProviderModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Provider Name *</label>
                                <input className="input h-11 w-full" value={providerForm.providerName} onChange={e => setProviderForm(f => ({ ...f, providerName: e.target.value }))} /></div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Provider Code *</label>
                                <input className="input h-11 w-full" placeholder="e.g., ICICI-LOMBARD" value={providerForm.providerCode} onChange={e => setProviderForm(f => ({ ...f, providerCode: e.target.value }))} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Contact Person</label>
                                    <input className="input h-11 w-full" value={providerForm.contactPerson} onChange={e => setProviderForm(f => ({ ...f, contactPerson: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                                    <input className="input h-11 w-full" value={providerForm.contactPhone} onChange={e => setProviderForm(f => ({ ...f, contactPhone: e.target.value }))} /></div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                            <button onClick={() => setShowProviderModal(false)} className="btn btn-secondary h-11 px-6">Cancel</button>
                            <button onClick={handleCreateProvider} disabled={isSubmitting} className="btn btn-primary h-11 px-6">{isSubmitting ? 'Adding...' : 'Add Provider'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
