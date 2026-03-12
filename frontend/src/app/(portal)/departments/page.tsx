'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
    FolderTree,
    Search,
    Plus,
    Trash2,
    X,
    Users,
    UserCheck,
    Building2,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/auth';
import toast from 'react-hot-toast';
import { Pagination } from '@/components/ui/pagination';

interface Department {
    id: string;
    name: string;
    description: string | null;
    headOfDepartmentId: string | null;
    isActive: boolean;
    parentDepartmentId: string | null;
    parentDepartment?: Department | null;
    createdAt: string;
}

export default function DepartmentsPage() {
    const { user } = useRequireAuth();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        headOfDepartmentId: '',
        isActive: true,
        parentDepartmentId: '',
    });

    const fetchDepartments = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/departments', {
                params: { page, limit: 10, search },
            });
            setDepartments(res.data.data || []);
            setTotalPages(res.data.meta?.totalPages || 1);
            setTotalItems(res.data.meta?.total || 0);
        } catch {
            // handled by global interceptor
        } finally {
            setIsLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/departments', {
                name: formData.name,
                description: formData.description || undefined,
                headOfDepartmentId: formData.headOfDepartmentId || undefined,
                isActive: formData.isActive,
                parentDepartmentId: formData.parentDepartmentId || undefined,
            });
            toast.success('Department created successfully');
            setShowModal(false);
            setFormData({ name: '', description: '', headOfDepartmentId: '', isActive: true, parentDepartmentId: '' });
            fetchDepartments();
        } catch {
            // handled by global interceptor
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this department?')) return;
        try {
            await apiClient.delete(`/departments/${id}`);
            toast.success('Department deleted');
            fetchDepartments();
        } catch {
            // handled by global interceptor
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">
                        Departments
                    </h1>
                    <p className="mt-1 text-sm md:text-base text-slate-500">
                        Manage hospital departments and organizational structure
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary gap-2 h-11 shadow-lg shadow-blue-200/60">
                    <Plus size={18} />
                    Add Department
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="card bg-white border-slate-200 shadow-sm p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Departments</p>
                        <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
                    </div>
                </div>
                <div className="card bg-white border-slate-200 shadow-sm p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Active</p>
                        <p className="text-2xl font-bold text-slate-900">{departments.filter(d => d.isActive).length}</p>
                    </div>
                </div>
                <div className="card bg-white border-slate-200 shadow-sm p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Sub-departments</p>
                        <p className="text-2xl font-bold text-slate-900">{departments.filter(d => d.parentDepartmentId).length}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden !p-0 shadow-sm border-slate-200 bg-white">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search departments..."
                            className="input pl-10 h-11"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                                <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Parent</th>
                                <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 sm:px-6 py-5"><div className="h-6 w-40 bg-slate-100 rounded-lg" /></td>
                                        <td className="hidden md:table-cell px-6 py-5"><div className="h-6 w-48 bg-slate-100 rounded-lg" /></td>
                                        <td className="px-4 sm:px-6 py-5"><div className="h-6 w-20 bg-slate-100 rounded-lg" /></td>
                                        <td className="hidden sm:table-cell px-6 py-5"><div className="h-6 w-24 bg-slate-100 rounded-lg" /></td>
                                        <td className="px-4 sm:px-6 py-5"><div className="h-8 w-8 bg-slate-100 rounded-lg float-right" /></td>
                                    </tr>
                                ))
                            ) : departments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <FolderTree size={32} />
                                        </div>
                                        <p className="text-slate-500 font-medium">No departments found</p>
                                        <p className="text-slate-400 text-sm mt-1">Create your first department to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                departments.map((dept) => (
                                    <tr key={dept.id} className="group hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-4 sm:px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <FolderTree size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{dept.name}</p>
                                                    <p className="text-xs text-slate-500 md:hidden mt-0.5">{dept.description || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-5 text-sm text-slate-600 max-w-xs truncate">
                                            {dept.description || '—'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-5">
                                            <span className={`badge ${dept.isActive ? 'badge-success' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                {dept.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-5 text-sm text-slate-600">
                                            {dept.parentDepartment?.name || '—'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-5 text-right">
                                            <button
                                                onClick={() => handleDelete(dept.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all sm:opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="border-t border-slate-100 px-6 py-4">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {/* Create Department Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Add Department</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Department Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Cardiology"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Description</label>
                                <textarea
                                    className="input min-h-[80px]"
                                    placeholder="Brief description of the department"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Parent Department</label>
                                <select
                                    className="input"
                                    value={formData.parentDepartmentId}
                                    onChange={(e) => setFormData({ ...formData, parentDepartmentId: e.target.value })}
                                >
                                    <option value="">None (Top-level)</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active</label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary flex-1">
                                    Create Department
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
