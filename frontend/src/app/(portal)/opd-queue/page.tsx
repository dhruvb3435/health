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
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/auth';
import toast from 'react-hot-toast';
import type { Appointment } from '@/types';

export default function OPDQueuePage() {
    const { user } = useRequireAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchQueue = useCallback(async () => {
        setIsLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const params: any = {
                appointmentDate: today,
                limit: 100
            };

            // If user is a doctor, filter by their ID automatically
            if (user?.roles.includes('doctor')) {
                // We'd need to find the doctor ID linked to this user
                // For now, let's fetch based on selection or all if admin
            }

            const res = await apiClient.get('/appointments', { params });
            // Sort by token number
            const sorted = (res.data.data || []).sort((a: any, b: any) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
            setAppointments(sorted);
        } catch {
            // handled by global interceptor
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    const updateStatus = async (id: string, status: string) => {
        try {
            await apiClient.patch(`/appointments/${id}`, { status });
            const label = status === 'in_progress' ? 'Patient called in' : status === 'completed' ? 'Consultation completed' : 'Status updated';
            toast.success(label);
            fetchQueue();
        } catch {
            // handled by global interceptor
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">OPD Consultation Queue</h1>
                    <p className="mt-1 text-sm md:text-base text-slate-500">Manage patient flow and live consultations</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex h-10 px-4 items-center gap-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold">
                        <Calendar size={16} />
                        {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Queue Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="card bg-white border-slate-200 shadow-sm p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Waiting</p>
                        <p className="text-2xl font-bold text-slate-900">{appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length}</p>
                    </div>
                </div>
                <div className="card bg-white border-slate-200 shadow-sm p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-pulse">
                        <Play size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">In Consultation</p>
                        <p className="text-2xl font-bold text-slate-900">{appointments.filter(a => a.status === 'in_progress').length}</p>
                    </div>
                </div>
                <div className="card bg-white border-slate-200 shadow-sm p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Check size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Completed</p>
                        <p className="text-2xl font-bold text-slate-900">{appointments.filter(a => a.status === 'completed').length}</p>
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
                        <button className="btn btn-secondary gap-2 h-11">
                            <Filter size={18} />
                            All Doctors
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px] sm:min-w-0">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Token</th>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Details</th>
                                <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
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
                                        <td className="px-4 sm:px-6 py-6"><div className="h-6 w-24 bg-slate-100 rounded-lg" /></td>
                                        <td className="px-4 sm:px-6 py-6"><div className="h-10 w-32 bg-slate-100 rounded-lg float-right" /></td>
                                    </tr>
                                ))
                            ) : (
                                appointments.map((app) => (
                                    <tr key={app.id} className={`group hover:bg-slate-50/50 transition-colors ${app.status === 'in_progress' ? 'bg-indigo-50/20' : ''}`}>
                                        <td className="px-4 sm:px-6 py-6">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${app.status === 'completed' ? 'bg-slate-100 text-slate-400' :
                                                app.status === 'in_progress' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-700'
                                                }`}>
                                                {app.tokenNumber || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{app.patient?.user?.firstName} {app.patient?.user?.lastName}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                        <span>{app.patient?.patientId}</span>
                                                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                        <span>{app.appointmentTime}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-5 text-sm text-slate-600 font-medium">
                                            Dr. {app.doctor?.user?.lastName}
                                        </td>
                                        <td className="px-4 sm:px-6 py-6">
                                            <span className={`badge ${app.status === 'completed' ? 'badge-success' :
                                                app.status === 'in_progress' ? 'badge-primary animate-pulse' :
                                                    app.status === 'cancelled' ? 'badge-error' : 'badge-warning'
                                                }`}>
                                                {app.status === 'scheduled' ? 'Waiting' : app.status === 'in_progress' ? 'Consulting' : app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {app.status !== 'completed' && app.status !== 'in_progress' && (
                                                    <button
                                                        onClick={() => updateStatus(app.id, 'in_progress')}
                                                        className="btn btn-primary h-9 px-4 text-xs gap-2"
                                                    >
                                                        <Play size={14} />
                                                        Call Patient
                                                    </button>
                                                )}
                                                {app.status === 'in_progress' && (
                                                    <button
                                                        onClick={() => updateStatus(app.id, 'completed')}
                                                        className="btn btn-success h-9 px-4 text-xs gap-2"
                                                    >
                                                        <Check size={14} />
                                                        Complete
                                                    </button>
                                                )}
                                                <button
                                                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Admit to IPD"
                                                >
                                                    <UserPlus size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {!isLoading && appointments.length === 0 && (
                        <div className="py-20 text-center">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Calendar size={40} />
                            </div>
                            <p className="text-slate-500 font-medium text-lg">Empty Queue</p>
                            <p className="text-slate-400 text-sm">No patients scheduled for today.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
