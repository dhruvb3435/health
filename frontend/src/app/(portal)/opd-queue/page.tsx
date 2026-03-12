'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
    Clock,
    Search,
    Filter,
    Play,
    Check,
    UserPlus,
    MoreHorizontal,
    Calendar,
    User,
    X,
    AlertTriangle,
    XCircle,
    Timer,
    Plus,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/auth';
import toast from 'react-hot-toast';
import type { OpdQueueEntry, QueueStats, QueueStatus, QueuePriority, Doctor } from '@/types';

const STATUS_CONFIG: Record<QueueStatus, { label: string; badge: string }> = {
    waiting: { label: 'Waiting', badge: 'badge-warning' },
    in_consultation: { label: 'Consulting', badge: 'badge-primary animate-pulse' },
    completed: { label: 'Completed', badge: 'badge-success' },
    cancelled: { label: 'Cancelled', badge: 'badge-error' },
    no_show: { label: 'No Show', badge: 'badge-error' },
};

const PRIORITY_CONFIG: Record<QueuePriority, { label: string; color: string }> = {
    normal: { label: 'Normal', color: 'bg-slate-100 text-slate-600' },
    urgent: { label: 'Urgent', color: 'bg-amber-100 text-amber-700' },
    emergency: { label: 'Emergency', color: 'bg-rose-100 text-rose-700' },
};

export default function OPDQueuePage() {
    const { user } = useRequireAuth();
    const [queue, setQueue] = useState<OpdQueueEntry[]>([]);
    const [stats, setStats] = useState<QueueStats>({ waiting: 0, inConsultation: 0, completed: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<QueueStatus | ''>('');
    const [showCheckinModal, setShowCheckinModal] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [checkinForm, setCheckinForm] = useState({
        patientId: '',
        doctorId: '',
        priority: 'normal' as QueuePriority,
        chiefComplaint: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchQueue = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/opd-queue');
            setQueue(res.data.data || []);
            if (res.data.stats) {
                setStats(res.data.stats);
            }
        } catch {
            // handled by global interceptor
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchDoctors = useCallback(async () => {
        try {
            const res = await apiClient.get('/doctors', { params: { limit: 100, isActive: true } });
            setDoctors(res.data.data || []);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        fetchQueue();
        fetchDoctors();
    }, [fetchQueue, fetchDoctors]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, [fetchQueue]);

    const updateStatus = async (id: string, status: QueueStatus) => {
        try {
            await apiClient.patch(`/opd-queue/${id}/status`, { status });
            const label = status === 'in_consultation' ? 'Patient called in'
                : status === 'completed' ? 'Consultation completed'
                : status === 'no_show' ? 'Marked as no-show'
                : status === 'cancelled' ? 'Cancelled'
                : 'Status updated';
            toast.success(label);
            fetchQueue();
        } catch {
            // handled by global interceptor
        }
    };

    const removeEntry = async (id: string) => {
        if (!confirm('Remove this patient from the queue?')) return;
        try {
            await apiClient.delete(`/opd-queue/${id}`);
            toast.success('Removed from queue');
            fetchQueue();
        } catch {
            // handled by global interceptor
        }
    };

    const handleCheckin = async () => {
        if (!checkinForm.patientId || !checkinForm.doctorId) {
            toast.error('Patient and Doctor are required');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/opd-queue', checkinForm);
            toast.success('Patient checked in successfully');
            setShowCheckinModal(false);
            setCheckinForm({ patientId: '', doctorId: '', priority: 'normal', chiefComplaint: '', notes: '' });
            fetchQueue();
        } catch {
            // handled by global interceptor
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredQueue = queue.filter(entry => {
        const matchesSearch = !search || [
            entry.patient?.user?.firstName,
            entry.patient?.user?.lastName,
            entry.patient?.patientId,
            String(entry.tokenNumber),
            entry.chiefComplaint,
        ].some(v => v?.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = !statusFilter || entry.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">OPD Consultation Queue</h1>
                    <p className="mt-1 text-sm md:text-base text-slate-500">Manage patient flow and live consultations</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 px-4 items-center gap-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold">
                        <Calendar size={16} />
                        {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <button
                        onClick={() => setShowCheckinModal(true)}
                        className="btn btn-primary h-10 gap-2"
                    >
                        <Plus size={18} />
                        Check-in Patient
                    </button>
                </div>
            </div>

            {/* Queue Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="card bg-white border-slate-200 shadow-sm p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Waiting</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.waiting}</p>
                    </div>
                </div>
                <div className="card bg-white border-slate-200 shadow-sm p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-pulse">
                        <Play size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">In Consultation</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.inConsultation}</p>
                    </div>
                </div>
                <div className="card bg-white border-slate-200 shadow-sm p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Check size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Completed</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
                    </div>
                </div>
                <div className="card bg-white border-slate-200 shadow-sm p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
                        <Timer size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Avg Wait</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.averageWaitMinutes || 0}<span className="text-sm font-medium text-slate-400 ml-1">min</span></p>
                    </div>
                </div>
            </div>

            {/* Queue Table */}
            <div className="card overflow-hidden !p-0 shadow-sm border-slate-200 bg-white">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by patient name or token..."
                            className="input pl-10 h-11"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="input h-11 text-sm"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as QueueStatus | '')}
                        >
                            <option value="">All Statuses</option>
                            <option value="waiting">Waiting</option>
                            <option value="in_consultation">In Consultation</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No Show</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-0">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Token</th>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Details</th>
                                <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                                <th className="hidden lg:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="hidden lg:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check-in</th>
                                <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 sm:px-6 py-6"><div className="h-8 w-10 bg-slate-100 rounded-lg" /></td>
                                        <td className="px-4 sm:px-6 py-6"><div className="h-10 w-48 bg-slate-100 rounded-lg" /></td>
                                        <td className="hidden md:table-cell px-6 py-6"><div className="h-6 w-32 bg-slate-100 rounded-lg" /></td>
                                        <td className="hidden lg:table-cell px-6 py-6"><div className="h-6 w-20 bg-slate-100 rounded-lg" /></td>
                                        <td className="px-4 sm:px-6 py-6"><div className="h-6 w-24 bg-slate-100 rounded-lg" /></td>
                                        <td className="hidden lg:table-cell px-6 py-6"><div className="h-6 w-16 bg-slate-100 rounded-lg" /></td>
                                        <td className="px-4 sm:px-6 py-6"><div className="h-10 w-32 bg-slate-100 rounded-lg float-right" /></td>
                                    </tr>
                                ))
                            ) : filteredQueue.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="py-20 text-center">
                                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                <Calendar size={40} />
                                            </div>
                                            <p className="text-slate-500 font-medium text-lg">Empty Queue</p>
                                            <p className="text-slate-400 text-sm">No patients in the queue{statusFilter ? ` with status "${STATUS_CONFIG[statusFilter]?.label}"` : ' for today'}.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredQueue.map((entry) => {
                                    const statusCfg = STATUS_CONFIG[entry.status] || { label: entry.status, badge: '' };
                                    const priorityCfg = PRIORITY_CONFIG[entry.priority] || PRIORITY_CONFIG.normal;
                                    const checkinTime = entry.checkinTime ? new Date(entry.checkinTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-';

                                    return (
                                        <tr key={entry.id} className={`group hover:bg-slate-50/50 transition-colors ${entry.status === 'in_consultation' ? 'bg-indigo-50/20' : ''} ${entry.priority === 'emergency' ? 'border-l-4 border-l-rose-500' : entry.priority === 'urgent' ? 'border-l-4 border-l-amber-500' : ''}`}>
                                            <td className="px-4 sm:px-6 py-5">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${entry.status === 'completed' ? 'bg-slate-100 text-slate-400' :
                                                    entry.status === 'in_consultation' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-700'
                                                    }`}>
                                                    {entry.tokenNumber}
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{entry.patient?.user?.firstName} {entry.patient?.user?.lastName}</p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                            {entry.patient?.patientId && <span>{entry.patient.patientId}</span>}
                                                            {entry.chiefComplaint && (
                                                                <>
                                                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                                    <span className="truncate max-w-[150px]">{entry.chiefComplaint}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-5 text-sm text-slate-600 font-medium">
                                                Dr. {entry.doctor?.user?.firstName} {entry.doctor?.user?.lastName}
                                            </td>
                                            <td className="hidden lg:table-cell px-6 py-5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${priorityCfg.color}`}>
                                                    {entry.priority === 'emergency' && <AlertTriangle size={12} />}
                                                    {priorityCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-5">
                                                <span className={`badge ${statusCfg.badge}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="hidden lg:table-cell px-6 py-5 text-sm text-slate-500">
                                                {checkinTime}
                                            </td>
                                            <td className="px-4 sm:px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {entry.status === 'waiting' && (
                                                        <button
                                                            onClick={() => updateStatus(entry.id, 'in_consultation')}
                                                            className="btn btn-primary h-9 px-4 text-xs gap-2"
                                                        >
                                                            <Play size={14} />
                                                            Call
                                                        </button>
                                                    )}
                                                    {entry.status === 'in_consultation' && (
                                                        <button
                                                            onClick={() => updateStatus(entry.id, 'completed')}
                                                            className="btn btn-success h-9 px-4 text-xs gap-2"
                                                        >
                                                            <Check size={14} />
                                                            Complete
                                                        </button>
                                                    )}
                                                    {entry.status === 'waiting' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateStatus(entry.id, 'no_show')}
                                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                                title="Mark as No-Show"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(entry.id, 'cancelled')}
                                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Check-in Modal */}
            {showCheckinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">Patient Check-in</h2>
                            <button onClick={() => setShowCheckinModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Patient ID *</label>
                                <input
                                    type="text"
                                    className="input h-11 w-full"
                                    placeholder="Enter Patient UUID"
                                    value={checkinForm.patientId}
                                    onChange={e => setCheckinForm(f => ({ ...f, patientId: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor *</label>
                                <select
                                    className="input h-11 w-full"
                                    value={checkinForm.doctorId}
                                    onChange={e => setCheckinForm(f => ({ ...f, doctorId: e.target.value }))}
                                >
                                    <option value="">Select Doctor</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={doc.id}>
                                            Dr. {doc.user?.firstName} {doc.user?.lastName} - {doc.specialization}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                                <div className="flex gap-3">
                                    {(['normal', 'urgent', 'emergency'] as QueuePriority[]).map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setCheckinForm(f => ({ ...f, priority: p }))}
                                            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${checkinForm.priority === p
                                                ? p === 'emergency' ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                    : p === 'urgent' ? 'border-amber-500 bg-amber-50 text-amber-700'
                                                        : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {p === 'emergency' && <AlertTriangle size={14} className="inline mr-1" />}
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Chief Complaint</label>
                                <input
                                    type="text"
                                    className="input h-11 w-full"
                                    placeholder="e.g., Chest pain since 2 days"
                                    value={checkinForm.chiefComplaint}
                                    onChange={e => setCheckinForm(f => ({ ...f, chiefComplaint: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                                <textarea
                                    className="input w-full min-h-[80px] py-3"
                                    placeholder="Additional notes..."
                                    value={checkinForm.notes}
                                    onChange={e => setCheckinForm(f => ({ ...f, notes: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                            <button onClick={() => setShowCheckinModal(false)} className="btn btn-secondary h-11 px-6">Cancel</button>
                            <button onClick={handleCheckin} disabled={isSubmitting} className="btn btn-primary h-11 px-6 gap-2">
                                {isSubmitting ? 'Checking in...' : (
                                    <>
                                        <UserPlus size={18} />
                                        Check-in
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
