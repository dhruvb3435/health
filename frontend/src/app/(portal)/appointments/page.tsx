'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Calendar as CalendarIcon, Clock, MoreHorizontal, Plus, Search, Filter, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Pagination } from '@/components/ui/pagination';
import type { Appointment, Patient, Doctor } from '@/types';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '09:00',
    reason: '',
    notes: '',
    status: 'scheduled'
  });

  const limit = 10;

  const fetchAppointments = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const params: any = {
        search: searchQuery,
        page: pageNumber,
        limit
      };
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await apiClient.get('/appointments', { params });
      setAppointments(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch appointments', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        apiClient.get('/patients', { params: { limit: 100 } }),
        apiClient.get('/doctors', { params: { limit: 100 } })
      ]);
      setPatients(patientsRes.data.data || []);
      setDoctors(doctorsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch dependencies', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAppointments(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, dateFrom, dateTo, fetchAppointments]);

  useEffect(() => {
    if (page > 1) {
      fetchAppointments(search, page);
    }
  }, [page, fetchAppointments]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/appointments', formData);
      toast.success('Appointment scheduled successfully');
      setIsModalOpen(false);
      setFormData({
        patientId: '',
        doctorId: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '09:00',
        reason: '',
        notes: '',
        status: 'scheduled'
      });
      fetchAppointments(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel and delete this appointment?')) return;
    try {
      await apiClient.delete(`/appointments/${id}`);
      toast.success('Appointment deleted');
      fetchAppointments(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Appointments</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Schedule and manage patient consultations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11"
        >
          <Plus size={18} />
          New Appointment
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search appointments..."
              className="input pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-secondary gap-2 h-11 justify-center sm:px-6 ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}
          >
            <Filter size={18} />
            Filters
            {(statusFilter || dateFrom || dateTo) && (
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <select
                className="input h-10 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Date</label>
              <input
                type="date"
                className="input h-10 text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Date</label>
              <input
                type="date"
                className="input h-10 text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); }}
                className="btn btn-secondary h-10 px-4 text-xs font-bold"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 sm:px-6 py-4"><div className="h-10 w-40 bg-slate-100 rounded" /></td>
                      <td className="hidden sm:table-cell px-6 py-4"><div className="h-10 w-32 bg-slate-100 rounded" /></td>
                      <td className="px-4 sm:px-6 py-4"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                      <td className="hidden md:table-cell px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-4 sm:px-6 py-4" />
                    </tr>
                  ))
                ) : (
                  appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-sm">
                            {app.patient?.user?.firstName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                              {app.patient?.user?.firstName} {app.patient?.user?.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{app.patient?.patientId}</p>
                            {/* Show doctor inline on mobile since Doctor column is hidden */}
                            <p className="sm:hidden text-xs text-slate-500 mt-0.5">Dr. {app.doctor?.user?.firstName} {app.doctor?.user?.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <p className="font-medium text-slate-900 truncate">
                          Dr. {app.doctor?.user?.firstName} {app.doctor?.user?.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{app.doctor?.specialization}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-slate-700 font-medium">
                            <CalendarIcon size={14} className="mr-1.5 text-indigo-400" />
                            {new Date(app.appointmentDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-xs text-slate-500">
                            <Clock size={14} className="mr-1.5 text-slate-400" />
                            {app.appointmentTime}
                          </div>
                          {/* Show status inline on mobile since Status column is hidden */}
                          <span className={`md:hidden badge ${app.status === 'completed' ? 'badge-success' :
                            app.status === 'scheduled' ? 'badge-primary' : 'badge-warning'
                            }`}>
                            {app.status}
                          </span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <span className={`badge ${app.status === 'completed' ? 'badge-success' :
                          app.status === 'scheduled' ? 'badge-primary' : 'badge-warning'
                          }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDelete(app.id)}
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
            {!isLoading && appointments.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-slate-500 font-medium">No appointments scheduled.</p>
              </div>
            )}
          </div>

          {!isLoading && totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={totalItems}
              limit={limit}
            />
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="new-appointment-title">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div>
                <h2 id="new-appointment-title" className="text-xl font-bold text-slate-900 font-display">New Appointment</h2>
                <p className="text-sm text-slate-500">Schedule a new consultation session</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="px-6 sm:px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Patient</label>
                  <select
                    required
                    className="input h-11"
                    value={formData.patientId}
                    onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.user?.firstName} {p.user?.lastName} ({p.patientId})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Doctor</label>
                  <select
                    required
                    className="input h-11"
                    value={formData.doctorId}
                    onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.user?.firstName} {d.user?.lastName} - {d.specialization}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Appointment Date</label>
                  <input
                    required
                    type="date"
                    className="input h-11"
                    value={formData.appointmentDate}
                    onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Preferred Time</label>
                  <input
                    required
                    type="time"
                    className="input h-11"
                    value={formData.appointmentTime}
                    onChange={e => setFormData({ ...formData, appointmentTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Reason for Visit</label>
                  <input
                    required
                    type="text"
                    className="input h-11"
                    placeholder="Brief description of the consultation"
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Special Notes</label>
                  <textarea
                    className="input min-h-[100px] py-3"
                    placeholder="Any specific symptoms or prior history..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary flex-1 h-12"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 h-12 shadow-indigo-100"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
