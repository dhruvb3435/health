'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRequireRole } from '@/hooks/auth';
import { apiClient } from '@/lib/api-client';
import {
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  Plus,
  Search,
  X,
  MoreHorizontal,
  CalendarClock,
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { ComplianceItem } from '@/types';

type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending_review' | 'under_remediation';

const statusConfig: Record<ComplianceStatus, { label: string; bg: string; text: string; ring: string }> = {
  compliant: { label: 'Compliant', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  non_compliant: { label: 'Non-Compliant', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
  pending_review: { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  under_remediation: { label: 'Under Remediation', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
};

export default function CompliancePage() {
  useRequireRole('admin', 'super_admin');

  const [records, setRecords] = useState<ComplianceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    compliant: 0,
    nonCompliant: 0,
    pendingReview: 0,
    upcomingAudits: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    complianceType: '',
    description: '',
    regulatoryBody: '',
    status: 'pending_review' as string,
    lastAuditDate: '',
    nextAuditDate: '',
    findings: '',
    actionItems: '',
    remarks: '',
  });

  const limit = 10;

  const fetchRecords = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        search: searchQuery,
        page: pageNumber,
        limit,
      };
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/compliance/records', { params });
      const data = res.data.data || res.data || [];
      setRecords(Array.isArray(data) ? data : []);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotalItems(res.data.meta?.total || data.length || 0);

      // Calculate stats from data
      const allRecords = Array.isArray(data) ? data : [];
      const compliantCount = allRecords.filter((r: ComplianceItem) => r.status === 'compliant').length;
      const nonCompliantCount = allRecords.filter((r: ComplianceItem) => r.status === 'non_compliant').length;
      const pendingCount = allRecords.filter((r: ComplianceItem) => r.status === 'pending_review').length;
      const upcoming = allRecords.filter((r: ComplianceItem) => {
        if (!r.nextAuditDate) return false;
        const nextAudit = new Date(r.nextAuditDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return nextAudit <= thirtyDaysFromNow && nextAudit >= new Date();
      }).length;

      setStats({
        compliant: compliantCount,
        nonCompliant: nonCompliantCount,
        pendingReview: pendingCount,
        upcomingAudits: upcoming,
      });
    } catch {
      // handled by global interceptor
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchRecords(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, fetchRecords]);

  useEffect(() => {
    if (page > 1) {
      fetchRecords(search, page);
    }
  }, [page, fetchRecords]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/compliance/records', formData);
      toast.success('Compliance record created successfully');
      setIsModalOpen(false);
      setFormData({
        complianceType: '',
        description: '',
        regulatoryBody: '',
        status: 'pending_review',
        lastAuditDate: '',
        nextAuditDate: '',
        findings: '',
        actionItems: '',
        remarks: '',
      });
      fetchRecords(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as ComplianceStatus];
    if (!config) return { label: status, bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' };
    return config;
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Compliance & Audit</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Monitor HIPAA, data security, and regulatory compliance</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11 shadow-indigo-100"
        >
          <Plus size={18} />
          Add Record
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card shadow-sm border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliant Items</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 text-emerald-700 font-display">{stats.compliant}</h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Non-Compliant</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 text-rose-700 font-display">{stats.nonCompliant}</h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle size={20} />
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Review</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 text-amber-700 font-display">{stats.pendingReview}</h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming Audits</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 text-blue-700 font-display">{stats.upcomingAudits}</h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <CalendarClock size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search compliance records..."
            className="input pl-10 h-11 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input h-11 sm:w-56"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="compliant">Compliant</option>
          <option value="non_compliant">Non-Compliant</option>
          <option value="pending_review">Pending Review</option>
          <option value="under_remediation">Under Remediation</option>
        </select>
      </div>

      {/* Records Table */}
      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Record ID</th>
                <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Compliance Type</th>
                <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Regulatory Body</th>
                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="hidden lg:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Last Audit</th>
                <th className="hidden xl:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Next Audit</th>
                <th className="px-4 sm:px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 sm:px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="hidden sm:table-cell px-6 py-4"><div className="h-5 w-20 bg-slate-100 rounded-full" /></td>
                    <td className="hidden md:table-cell px-6 py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                    <td className="px-4 sm:px-6 py-4"><div className="h-5 w-20 bg-slate-100 rounded-full" /></td>
                    <td className="hidden lg:table-cell px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="hidden xl:table-cell px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-4 sm:px-6 py-4" />
                  </tr>
                ))
              ) : (
                records.map((record) => {
                  const badge = getStatusBadge(record.status);
                  return (
                    <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors group border-b border-slate-50 last:border-0">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm">
                            {record.recordId || record.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[180px]">
                            {record.description}
                          </p>
                          <p className="sm:hidden text-xs text-slate-500 mt-0.5 capitalize">{record.complianceType}</p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                          {record.complianceType}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <p className="text-sm text-slate-600">{record.regulatoryBody || '-'}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${badge.bg} ${badge.text} ${badge.ring}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-600">
                          {record.lastAuditDate ? new Date(record.lastAuditDate).toLocaleDateString() : '-'}
                        </p>
                      </td>
                      <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-600">
                          {record.nextAuditDate ? new Date(record.nextAuditDate).toLocaleDateString() : '-'}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <button className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all sm:opacity-0 group-hover:opacity-100">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!isLoading && records.length === 0 && (
            <div className="py-20 text-center bg-white space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Shield size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No compliance records found</p>
              <p className="text-sm text-slate-500">
                {search || statusFilter ? 'Try adjusting your filters.' : 'Add your first compliance record to get started.'}
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

      {/* Add Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Add Compliance Record</h2>
                <p className="text-sm text-slate-500">Create a new compliance tracking entry</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="px-6 sm:px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Compliance Type</label>
                  <select
                    required
                    className="input h-11"
                    value={formData.complianceType}
                    onChange={(e) => setFormData({ ...formData, complianceType: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="HIPAA">HIPAA</option>
                    <option value="OSHA">OSHA</option>
                    <option value="NABH">NABH</option>
                    <option value="JCI">JCI</option>
                    <option value="Fire Safety">Fire Safety</option>
                    <option value="Infection Control">Infection Control</option>
                    <option value="Data Protection">Data Protection</option>
                    <option value="Drug Safety">Drug Safety</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Regulatory Body</label>
                  <input
                    type="text"
                    className="input h-11"
                    placeholder="e.g. HHS, OSHA, State Board"
                    value={formData.regulatoryBody}
                    onChange={(e) => setFormData({ ...formData, regulatoryBody: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <input
                    required
                    type="text"
                    className="input h-11"
                    placeholder="Brief description of the compliance item"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Status</label>
                  <select
                    required
                    className="input h-11"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="compliant">Compliant</option>
                    <option value="non_compliant">Non-Compliant</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="under_remediation">Under Remediation</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Last Audit Date</label>
                  <input
                    type="date"
                    className="input h-11"
                    value={formData.lastAuditDate}
                    onChange={(e) => setFormData({ ...formData, lastAuditDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Next Audit Date</label>
                  <input
                    type="date"
                    className="input h-11"
                    value={formData.nextAuditDate}
                    onChange={(e) => setFormData({ ...formData, nextAuditDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Findings</label>
                  <input
                    type="text"
                    className="input h-11"
                    placeholder="Key audit findings"
                    value={formData.findings}
                    onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Action Items</label>
                  <textarea
                    className="input min-h-[80px] py-3 text-sm"
                    placeholder="Required corrective actions..."
                    value={formData.actionItems}
                    onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Remarks</label>
                  <textarea
                    className="input min-h-[60px] py-3 text-sm"
                    placeholder="Additional notes..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary flex-1 h-12 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 h-12 shadow-indigo-100 font-bold"
                >
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
