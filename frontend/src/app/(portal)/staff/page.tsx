'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRequireRole } from '@/hooks/auth';
import { apiClient } from '@/lib/api-client';
import { Search, Filter, MoreHorizontal, X, Trash2, Plus, Mail, Phone, Briefcase, Calendar } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { Staff } from '@/types';

export default function StaffPage() {
  useRequireRole('admin', 'super_admin');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'Nurse',
    department: 'General',
    shift: 'Morning',
    salary: 3000,
    hireDate: new Date().toISOString().split('T')[0],
    contractType: 'Full-time',
    notes: ''
  });

  const limit = 10;

  const fetchStaff = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/staff', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setStaff(res.data.data);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotalItems(res.data.meta?.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch staff', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStaff(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchStaff]);

  useEffect(() => {
    if (page > 1) {
      fetchStaff(search, page);
    }
  }, [page, fetchStaff]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/staff', formData);
      toast.success('Staff member added successfully');
      setIsModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: 'Nurse',
        department: 'General',
        shift: 'Morning',
        salary: 3000,
        hireDate: new Date().toISOString().split('T')[0],
        contractType: 'Full-time',
        notes: ''
      });
      fetchStaff(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await apiClient.delete(`/staff/${id}`);
      toast.success('Staff member removed');
      fetchStaff(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Staff Management</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Manage nurses, administrative, and clinical professionals</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11 shadow-indigo-100"
        >
          <Plus size={18} />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search staff by name, role or ID..."
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
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Staff Details</th>
                <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status / Hire Date</th>
                <th className="px-4 sm:px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 sm:px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                    <td className="hidden sm:table-cell px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="hidden md:table-cell px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    <td className="px-4 sm:px-6 py-4 text-right" />
                  </tr>
                ))
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-indigo-50/30 transition-colors group border-b border-slate-50 last:border-0">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 shadow-sm border border-indigo-100 text-sm">
                          {member.user?.firstName?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm sm:text-base">
                            {member.user?.firstName} {member.user?.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium truncate">{member.user?.email}</span>
                            <span className="h-3 w-[1px] bg-slate-200"></span>
                            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{member.role}</span>
                          </div>
                          {/* Show department and status inline on mobile since columns are hidden */}
                          <div className="sm:hidden flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-medium">{member.department}</span>
                            <span className={`md:hidden badge ${member.status === 'active' ? 'badge-success' : 'badge-warning'} font-bold text-[10px]`}>
                              {member.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">{member.department}</p>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="min-w-0">
                        <div className="mb-1">
                          <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-warning'} font-bold text-[10px]`}>
                            {member.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Joined: {member.hireDate ? new Date(member.hireDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(member.id)}
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

          {!isLoading && staff.length === 0 && (
            <div className="py-20 text-center bg-white space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Briefcase size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No staff members found</p>
              <p className="text-sm text-slate-500">
                {search ? `No results for "${search}".` : 'Add your first staff member to get started.'}
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


      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Add Staff Member</h2>
                <p className="text-sm text-slate-500">Create new staff profile and credentials</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Personal Information</h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">First Name</label>
                    <input required className="input h-11" placeholder="John" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Last Name</label>
                    <input required className="input h-11" placeholder="Doe" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Mail size={14} /> Email</label>
                    <input type="email" required className="input h-11" placeholder="john.doe@hospital.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Phone size={14} /> Phone</label>
                    <input className="input h-11" placeholder="+1 (555) 000-0000" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Employment Details</h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Briefcase size={14} /> Role</label>
                    <select required className="input h-11" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                      <option value="Nurse">Nurse</option>
                      <option value="Pharmacist">Pharmacist</option>
                      <option value="Lab Technician">Lab Technician</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Department</label>
                    <select required className="input h-11" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                      <option value="General">General</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Laboratory">Laboratory</option>
                      <option value="Administration">Administration</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Shift</label>
                    <select required className="input h-11" value={formData.shift} onChange={e => setFormData({ ...formData, shift: e.target.value })}>
                      <option value="Morning">Morning (8 AM - 4 PM)</option>
                      <option value="Evening">Evening (4 PM - 12 AM)</option>
                      <option value="Night">Night (12 AM - 8 AM)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Monthly Salary ($)</label>
                    <input type="number" required className="input h-11" value={formData.salary} onChange={e => setFormData({ ...formData, salary: parseInt(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Calendar size={14} /> Hire Date</label>
                    <input type="date" required className="input h-11" value={formData.hireDate} onChange={e => setFormData({ ...formData, hireDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Contract</label>
                    <select required className="input h-11" value={formData.contractType} onChange={e => setFormData({ ...formData, contractType: e.target.value })}>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Internal Notes</label>
                <textarea className="input min-h-[100px] py-3 text-sm" placeholder="Additional background info..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
              </div>
            </form>

            <div className="px-6 sm:px-8 py-5 border-t border-slate-100 bg-white flex gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1 h-12 font-bold">Cancel</button>
              <button
                type="submit"
                onClick={handleAddStaff}
                className="btn btn-primary flex-1 h-12 shadow-indigo-100 font-bold"
              >
                Create Staff Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

