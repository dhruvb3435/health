'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Stethoscope, Clock, CheckCircle, Search, Filter, MoreHorizontal, Plus, X, Trash2, Calendar, User, UserCheck } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { Surgery, Patient, Doctor } from '@/types';

export default function OperationTheaterPage() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    surgeryId: `SURG-${Math.floor(Math.random() * 100000)}`,
    patientId: '',
    surgeonId: '',
    theatreId: 'OT-1',
    surgeryType: '',
    status: 'scheduled',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    anesthetist: '',
    preOpNotes: '',
    diagnosis: '',
    estimatedCost: 5000
  });

  const limit = 10;

  const fetchSurgeries = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/operation-theater/surgeries', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setSurgeries(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotalItems(res.data.meta?.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch surgeries', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        apiClient.get('/patients', { params: { limit: 100 } }),
        apiClient.get('/doctors', { params: { limit: 100 } })
      ]);
      setPatients(patientsRes.data.data || []);
      setDoctors(doctorsRes.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch dependencies', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSurgeries(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchSurgeries]);

  useEffect(() => {
    if (page > 1) {
      fetchSurgeries(search, page);
    }
  }, [page, fetchSurgeries]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const handleCreateSurgery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/operation-theater/surgeries', formData);
      toast.success('Surgery scheduled successfully');
      setIsModalOpen(false);
      setFormData({
        ...formData,
        surgeryId: `SURG-${Math.floor(Math.random() * 100000)}`,
        patientId: '',
        surgeonId: '',
        surgeryType: '',
        preOpNotes: '',
        diagnosis: ''
      });
      fetchSurgeries(search, page);
    } catch {
      // handled by global interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled surgery?')) return;
    try {
      await apiClient.delete(`/operation-theater/surgeries/${id}`);
      toast.success('Surgery cancelled');
      fetchSurgeries(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Operation Theater</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Schedule and manage hospital surgical procedures</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11 shadow-indigo-100"
        >
          <Plus size={18} />
          <span>Schedule Surgery</span>
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card shadow-sm border-slate-200 p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
              <Stethoscope size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Surgeries</p>
              <p className="text-2xl font-bold text-slate-900 font-display">{surgeries.filter(s => s.status === 'in_progress').length}</p>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled Today</p>
              <p className="text-2xl font-bold text-slate-900 font-display">{surgeries.filter(s => s.status === 'scheduled').length}</p>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-6 bg-white sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
              <p className="text-2xl font-bold text-slate-900 font-display">{surgeries.filter(s => s.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by surgery type, ID or surgeon..."
            className="input pl-10 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary gap-2 h-11 justify-center sm:px-6 font-bold">
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px] sm:min-w-0">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Surgery / ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Surgeon / Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Schedule</th>
                <th className="px-4 sm:px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 sm:px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    <td className="px-4 sm:px-6 py-4 text-right" />
                  </tr>
                ))
              ) : (
                surgeries.map((surgery) => (
                  <tr key={surgery.id} className="hover:bg-indigo-50/30 transition-colors group border-b border-slate-50 last:border-0">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                          <Stethoscope size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm sm:text-base">
                            {surgery.surgeryType}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{surgery.surgeryId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {surgery.patient ? (
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700">{surgery.patient.user?.firstName} {surgery.patient.user?.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{surgery.patient.patientId}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700 mb-1">
                          Dr. {surgery.surgeon?.user?.firstName} {surgery.surgeon?.user?.lastName}
                        </p>
                        <span className={`badge ${surgery.status === 'completed' ? 'badge-success' : surgery.status === 'in_progress' ? 'badge-warning' : 'badge-primary'} font-bold text-[10px]`}>
                          {surgery.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-slate-700">{new Date(surgery.scheduledDate).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{surgery.startTime} - {surgery.endTime}</p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(surgery.id)}
                          className="p-1.5 sm:p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="p-1.5 sm:p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!isLoading && surgeries.length === 0 && (
            <div className="py-20 text-center bg-white space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Stethoscope size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No surgeries scheduled</p>
              <p className="text-sm text-slate-500">
                {search ? `No results for "${search}".` : 'Schedule your first surgical procedure to get started.'}
              </p>
            </div>
          )}
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={totalItems}
              limit={limit}
            />
          </div>
        )}
      </div>


      {/* Schedule Surgery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Schedule New Surgery</h2>
                <p className="text-sm text-slate-500">Book operation theater and surgical team</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSurgery} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Surgery ID</label>
                  <input className="input h-11 bg-slate-50 font-mono text-xs" readOnly value={formData.surgeryId} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><User size={14} /> Patient</label>
                  <select required className="input h-11" value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })}>
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.user?.firstName} {p.user?.lastName} ({p.patientId})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><UserCheck size={14} /> Surgeon</label>
                  <select required className="input h-11" value={formData.surgeonId} onChange={e => setFormData({ ...formData, surgeonId: e.target.value })}>
                    <option value="">Select Surgeon</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.user?.firstName} {d.user?.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Surgery Type</label>
                  <input required className="input h-11" placeholder="e.g. Appendectomy" value={formData.surgeryType} onChange={e => setFormData({ ...formData, surgeryType: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Theater ID</label>
                  <select className="input h-11" value={formData.theatreId} onChange={e => setFormData({ ...formData, theatreId: e.target.value })}>
                    <option value="OT-1">Main Theater (OT-1)</option>
                    <option value="OT-2">Secondary Theater (OT-2)</option>
                    <option value="OT-3">Emergency Theater (OT-3)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Calendar size={14} /> Scheduled Date</label>
                  <input type="date" required className="input h-11" value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Start Time</label>
                  <input type="time" required className="input h-11" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Estimated Duration</label>
                  <input type="time" required className="input h-11" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Lead Anesthetist</label>
                  <input className="input h-11" placeholder="Name of anesthetist" value={formData.anesthetist} onChange={e => setFormData({ ...formData, anesthetist: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Pre-Op Diagnosis</label>
                  <textarea className="input min-h-[100px] py-3 text-sm" placeholder="Current patient diagnosis..." value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Surgical Notes</label>
                  <textarea className="input min-h-[100px] py-3 text-sm" placeholder="Any special instructions or equipment needed..." value={formData.preOpNotes} onChange={e => setFormData({ ...formData, preOpNotes: e.target.value })}></textarea>
                </div>
              </div>
            </form>

            <div className="px-6 sm:px-8 py-5 border-t border-slate-100 bg-white flex gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1 h-12 font-bold">Cancel</button>
              <button
                type="submit"
                onClick={handleCreateSurgery}
                disabled={isSubmitting}
                className="btn btn-primary flex-1 h-12 shadow-indigo-100 font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Surgery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

