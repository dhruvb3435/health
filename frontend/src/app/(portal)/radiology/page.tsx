'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Microscope, Search, Filter, MoreHorizontal, ClipboardList } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { RadiologyRequest } from '@/types';

const IMAGING_TYPE_LABELS: Record<string, string> = {
  x_ray: 'X-Ray',
  ct_scan: 'CT Scan',
  mri: 'MRI',
  ultrasound: 'Ultrasound',
  mammography: 'Mammography',
};

export default function RadiologyPage() {
  const [requests, setRequests] = useState<RadiologyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const limit = 10;

  const fetchRequests = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/radiology/requests', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
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
      fetchRequests(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchRequests]);

  useEffect(() => {
    if (page > 1) {
      fetchRequests(search, page);
    }
  }, [page, fetchRequests]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Radiology</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Monitor imaging requests, scans and diagnostic reports</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pending</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-display">18</span>
              <span className="badge badge-warning text-[9px] font-bold">+3 new</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Completed</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-display">35</span>
              <span className="badge badge-success text-[9px] font-bold uppercase">On Track</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Reported</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-indigo-600 font-display">29</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">This week</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Requests</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-display">82</span>
              <span className="badge badge-primary text-[9px] font-bold uppercase">All Time</span>
            </div>
          </div>
        </div>
      </div>

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
        <button className="btn btn-secondary gap-2 h-11 justify-center sm:px-6 font-bold">
          <Filter size={18} />
          Filters
        </button>
      </div>

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
                {search ? `No results for "${search}".` : 'Radiology requests will appear here once created.'}
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
    </div>
  );
}
