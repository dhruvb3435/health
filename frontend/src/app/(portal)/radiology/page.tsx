'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Microscope, Search, Filter, MoreHorizontal, ClipboardList, Plus, X } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { RadiologyRequest, RadiologyStatus, ImagingType } from '@/types';

const IMAGING_TYPE_LABELS: Record<string, string> = {
  x_ray: 'X-Ray',
  ct_scan: 'CT Scan',
  mri: 'MRI',
  ultrasound: 'Ultrasound',
  mammography: 'Mammography',
};

const STATUS_OPTIONS: { value: RadiologyStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'reported', label: 'Reported' },
  { value: 'archived', label: 'Archived' },
];

const IMAGING_TYPE_OPTIONS: { value: ImagingType; label: string }[] = [
  { value: 'x_ray', label: 'X-Ray' },
  { value: 'ct_scan', label: 'CT Scan' },
  { value: 'mri', label: 'MRI' },
  { value: 'ultrasound', label: 'Ultrasound' },
  { value: 'mammography', label: 'Mammography' },
];

interface CreateFormData {
  patientId: string;
  doctorId: string;
  imagingType: ImagingType;
  bodyPart: string;
  clinicalHistory: string;
  scheduledDate: string;
}

const EMPTY_FORM: CreateFormData = {
  patientId: '',
  doctorId: '',
  imagingType: 'x_ray',
  bodyPart: '',
  clinicalHistory: '',
  scheduledDate: '',
};

export default function RadiologyPage() {
  const [requests, setRequests] = useState<RadiologyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RadiologyStatus | ''>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateFormData>(EMPTY_FORM);

  const limit = 10;

  // Compute stats from the fetched page — for accurate totals use API meta when available,
  // but for per-status breakdowns we count across the current data set.
  // The totalItems from meta gives us the real "Total Requests" count.
  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    reported: requests.filter((r) => r.status === 'reported').length,
    total: totalItems,
  };

  const fetchRequests = useCallback(async (searchQuery = '', pageNumber = 1, status: RadiologyStatus | '' = '') => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        search: searchQuery,
        page: pageNumber,
        limit,
      };
      if (status) params.status = status;

      const res = await apiClient.get('/radiology/requests', { params });
      setRequests(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch {
      toast.error('Failed to load radiology requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchRequests(search, 1, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, fetchRequests]);

  useEffect(() => {
    if (page > 1) {
      fetchRequests(search, page, statusFilter);
    }
  }, [page, fetchRequests]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        imagingType: formData.imagingType,
        bodyPart: formData.bodyPart,
        clinicalHistory: formData.clinicalHistory || undefined,
        scheduledDate: formData.scheduledDate || undefined,
      };
      await apiClient.post('/radiology/requests', payload);
      toast.success('Radiology request created successfully!');
      setIsCreateModalOpen(false);
      setFormData(EMPTY_FORM);
      fetchRequests(search, page, statusFilter);
    } catch {
      // handled by global interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Radiology</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Monitor imaging requests, scans and diagnostic reports</p>
        </div>
        <button
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11"
          onClick={() => {
            setFormData(EMPTY_FORM);
            setIsCreateModalOpen(true);
          }}
        >
          <Plus size={18} />
          New Request
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pending</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
                {isLoading ? <span className="inline-block h-8 w-8 bg-slate-100 rounded animate-pulse" /> : stats.pending}
              </span>
              <span className="badge badge-warning text-[9px] font-bold">Awaiting</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Completed</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
                {isLoading ? <span className="inline-block h-8 w-8 bg-slate-100 rounded animate-pulse" /> : stats.completed}
              </span>
              <span className="badge badge-success text-[9px] font-bold uppercase">On Track</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Reported</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-indigo-600 font-display">
                {isLoading ? <span className="inline-block h-8 w-8 bg-slate-100 rounded animate-pulse" /> : stats.reported}
              </span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">Filed</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Requests</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
                {isLoading ? <span className="inline-block h-8 w-8 bg-slate-100 rounded animate-pulse" /> : stats.total}
              </span>
              <span className="badge badge-primary text-[9px] font-bold uppercase">All Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search radiology requests..."
              className="input pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-secondary gap-2 h-11 justify-center sm:px-6 font-bold ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}
          >
            <Filter size={18} />
            Filters
            {statusFilter && (
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
                onChange={(e) => {
                  setStatusFilter(e.target.value as RadiologyStatus | '');
                  setPage(1);
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setStatusFilter(''); setPage(1); }}
                className="btn btn-secondary h-10 px-4 text-xs font-bold"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-0">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Request / Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Imaging Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Body Part</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-4 sm:px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 sm:px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 sm:px-6 py-4 text-right" />
                  </tr>
                ))
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm">
                          <Microscope size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm truncate">
                            {req.requestId}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            Patient: <span className="font-bold text-slate-700">{req.patient?.user?.firstName} {req.patient?.user?.lastName}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">
                        {IMAGING_TYPE_LABELS[req.imagingType] || req.imagingType}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{req.bodyPart}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        req.status === 'completed' ? 'badge-success' :
                        req.status === 'pending' ? 'badge-warning' :
                        req.status === 'reported' ? 'badge-primary' :
                        'badge-secondary'
                      } font-bold text-[10px]`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {(req.status === 'completed' || req.status === 'reported') && (
                          <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="View Report">
                            <ClipboardList size={18} />
                          </button>
                        )}
                        <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!isLoading && requests.length === 0 && (
            <div className="py-20 text-center bg-white space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Microscope size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No radiology requests found</p>
              <p className="text-sm text-slate-500">
                {search
                  ? `No results for "${search}".`
                  : statusFilter
                  ? `No requests with status "${statusFilter}".`
                  : 'Radiology requests will appear here once created.'}
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

      {/* Create Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">New Radiology Request</h2>
                <p className="text-sm text-slate-500">Submit a new imaging request for a patient</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateRequest} className="px-6 sm:px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Patient ID</label>
                  <input
                    required
                    type="text"
                    className="input h-11"
                    placeholder="e.g. PAT-00123"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Doctor ID</label>
                  <input
                    required
                    type="text"
                    className="input h-11"
                    placeholder="e.g. DOC-00456"
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Imaging Type</label>
                  <select
                    required
                    className="input h-11"
                    value={formData.imagingType}
                    onChange={(e) => setFormData({ ...formData, imagingType: e.target.value as ImagingType })}
                  >
                    {IMAGING_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Body Part</label>
                  <input
                    required
                    type="text"
                    className="input h-11"
                    placeholder="e.g. Chest, Left Knee"
                    value={formData.bodyPart}
                    onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">
                    Clinical History <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    className="input h-20 py-2.5 resize-none"
                    placeholder="Relevant clinical notes or history..."
                    value={formData.clinicalHistory}
                    onChange={(e) => setFormData({ ...formData, clinicalHistory: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">
                    Scheduled Date <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    className="input h-11"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary flex-1 h-12"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary flex-1 h-12 disabled:opacity-60"
                >
                  {isSubmitting ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
