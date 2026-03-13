'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Beaker, Search, Filter, MoreHorizontal, FlaskConical, ClipboardList, X, Trash2 } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { LabTest, Patient, Doctor } from '@/types';

export default function LaboratoryPage() {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [labStats, setLabStats] = useState({ pending: 0, completed: 0, critical: 0 });

  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    testName: '',
    testCode: `LAB-${Math.floor(Math.random() * 10000)}`,
    testCategory: 'Blood',
    status: 'pending',
    orderedBy: '',
    notes: '',
    priority: 'normal',
    testResults: [] as any[]
  });

  const limit = 10;

  const fetchLabTests = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const params: any = {
        search: searchQuery,
        page: pageNumber,
        limit
      };
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/laboratory/lab-tests', { params });
      const data = res.data.data || [];
      setLabTests(data);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotalItems(res.data.meta?.total || 0);
      // Compute stats from data (first page approximation)
      if (pageNumber === 1 && !searchQuery) {
        setLabStats({
          pending: data.filter((t: LabTest) => t.status === 'pending').length,
          completed: data.filter((t: LabTest) => t.status === 'completed').length,
          critical: data.filter((t: LabTest) => t.status === 'critical').length,
        });
      }
    } catch {
      // handled by global interceptor
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        apiClient.get('/patients', { params: { limit: 100 } }),
        apiClient.get('/doctors', { params: { limit: 100 } })
      ]);
      setPatients(patientsRes.data.data || []);
      setDoctors(doctorsRes.data.data || []);
    } catch {
      // handled by global interceptor
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLabTests(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, fetchLabTests]);

  useEffect(() => {
    if (page > 1) {
      fetchLabTests(search, page);
    }
  }, [page, fetchLabTests]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/laboratory/lab-tests', formData);
      toast.success('Lab order placed successfully');
      setIsModalOpen(false);
      setFormData({
        patientId: '',
        testName: '',
        testCode: `LAB-${Math.floor(Math.random() * 10000)}`,
        testCategory: 'Blood',
        status: 'pending',
        orderedBy: '',
        notes: '',
        priority: 'normal',
        testResults: []
      });
      fetchLabTests(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel and delete this lab test?')) return;
    try {
      await apiClient.delete(`/laboratory/lab-tests/${id}`);
      toast.success('Lab test cancelled');
      fetchLabTests(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Laboratory</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Monitor lab tests, results and diagnostic reports</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11 shadow-indigo-100"
        >
          <Beaker size={18} />
          <span>New Order</span>
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pending Tests</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-display">{labStats.pending}</span>
              <span className="badge badge-warning text-[9px] font-bold">Awaiting</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Completed</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-display">{labStats.completed}</span>
              <span className="badge badge-success text-[9px] font-bold uppercase">Done</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Critical Results</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-rose-600 font-display">{labStats.critical}</span>
              {labStats.critical > 0 && <span className="badge badge-error text-[9px] font-bold pulse">Action</span>}
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Tests</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-indigo-600 font-display">{totalItems}</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">Records</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search lab tests..."
            className="input pl-10 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input h-11 text-sm sm:w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-0">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Test / Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor / Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-4 sm:px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 sm:px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 sm:px-6 py-4 text-right" />
                  </tr>
                ))
              ) : (
                labTests.map((test) => (
                  <tr key={test.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm">
                          <FlaskConical size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm truncate">
                            {test.testName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            Patient: <span className="font-bold text-slate-700">{test.patient?.user?.firstName} {test.patient?.user?.lastName}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">
                          Dr. {test.doctor?.user?.firstName} {test.doctor?.user?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Requested: {new Date(test.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${test.status === 'completed' ? 'badge-success' :
                        test.status === 'pending' ? 'badge-warning' : 'badge-primary'
                        } font-bold text-[10px]`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {test.status === 'completed' && (
                          <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="View Report">
                            <ClipboardList size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(test.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
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

          {!isLoading && labTests.length === 0 && (
            <div className="py-20 text-center bg-white space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                <FlaskConical size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No lab tests found</p>
              <p className="text-sm text-slate-500">
                {search ? `No results for "${search}".` : 'Create your first lab order to get started.'}
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


      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">New Lab Order</h2>
                <p className="text-sm text-slate-500">Request a new diagnostic test session</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="px-6 sm:px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Patient</label>
                  <select required className="input h-11" value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })}>
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.user?.firstName} {p.user?.lastName} ({p.patientId})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Requested By (Doctor)</label>
                  <select required className="input h-11" value={formData.orderedBy} onChange={e => setFormData({ ...formData, orderedBy: e.target.value })}>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.user?.firstName} {d.user?.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Test Name</label>
                  <input required className="input h-11" placeholder="e.g. Complete Blood Count" value={formData.testName} onChange={e => setFormData({ ...formData, testName: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Category</label>
                  <select className="input h-11" value={formData.testCategory} onChange={e => setFormData({ ...formData, testCategory: e.target.value })}>
                    <option value="Blood">Blood</option>
                    <option value="Urine">Urine</option>
                    <option value="Imaging">Imaging (X-Ray/MRI)</option>
                    <option value="Biopsy">Biopsy</option>
                    <option value="Microbiology">Microbiology</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Order ID</label>
                  <input className="input h-11 bg-slate-50" readOnly value={formData.testCode} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Priority</label>
                  <select className="input h-11" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent (STAT)</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Clinical History / Notes</label>
                  <textarea className="input min-h-[100px] py-3 text-sm" placeholder="Symptoms, diagnostic reasoning..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1 h-12 font-bold">Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 h-12 shadow-indigo-100 font-bold"
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

