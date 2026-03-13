'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { UserCheck, Star, Mail, Phone, MoreVertical, Search, Filter, X, Trash2, Edit2 } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { Doctor } from '@/types';

const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'General Medicine',
  'Physiotherapy',
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile/edit modal state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: 0,
    consultationFee: 0,
    biography: '',
    isActive: true,
  });

  // Add doctor form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    doctorId: `DOC-${Math.floor(Math.random() * 10000)}`,
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: 0,
    consultationFee: 500,
    phoneNumber: '',
    isActive: true
  });

  const limit = 6;

  const fetchDoctors = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        search: searchQuery,
        page: pageNumber,
        limit
      };
      if (specializationFilter) params.specialization = specializationFilter;
      const res = await apiClient.get('/doctors', { params });
      setDoctors(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error: unknown) {
      console.error('Failed to fetch doctors', error);
    } finally {
      setIsLoading(false);
    }
  }, [specializationFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchDoctors(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, specializationFilter, fetchDoctors]);

  useEffect(() => {
    if (page > 1) {
      fetchDoctors(search, page);
    }
  }, [page, fetchDoctors]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/doctors', formData);
      toast.success('Doctor registered successfully');
      setIsModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        doctorId: `DOC-${Math.floor(Math.random() * 10000)}`,
        specialization: '',
        licenseNumber: '',
        yearsOfExperience: 0,
        consultationFee: 500,
        phoneNumber: '',
        isActive: true
      });
      fetchDoctors(search, page);
    } catch {
      // handled by global interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this doctor from the portal?')) return;
    try {
      await apiClient.delete(`/doctors/${id}`);
      toast.success('Doctor removed');
      fetchDoctors(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  const openProfile = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setEditData({
      firstName: doctor.user?.firstName || '',
      lastName: doctor.user?.lastName || '',
      email: doctor.user?.email || '',
      phoneNumber: doctor.user?.phoneNumber || '',
      specialization: doctor.specialization || '',
      licenseNumber: doctor.licenseNumber || '',
      yearsOfExperience: doctor.yearsOfExperience || 0,
      consultationFee: doctor.consultationFee || 0,
      biography: doctor.biography || '',
      isActive: doctor.isActive,
    });
    setIsEditMode(false);
    setIsProfileOpen(true);
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setIsSaving(true);
    try {
      await apiClient.patch(`/doctors/${selectedDoctor.id}`, editData);
      toast.success('Doctor profile updated successfully');
      setIsProfileOpen(false);
      setIsEditMode(false);
      fetchDoctors(search, page);
    } catch {
      // handled by global interceptor
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Doctors</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Manage medical staff and specialists</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11"
        >
          <UserCheck size={18} />
          Add Doctor
        </button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search doctors..."
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
            {specializationFilter && (
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specialization</label>
              <select
                className="input h-10 text-sm"
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
              >
                <option value="">All Specializations</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSpecializationFilter('')}
                className="btn btn-secondary h-10 px-4 text-xs font-bold"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-slate-50 border-slate-100" />
          ))
        ) : (
          doctors.map((doctor) => (
            <div key={doctor.id} className="card group hover:border-indigo-200 transition-all hover:shadow-md bg-white border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl shadow-sm border border-indigo-100">
                    {doctor.user?.firstName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-700 transition-colors">
                      Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                    </h3>
                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{doctor.specialization}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(doctor.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-bold border border-amber-100 shadow-sm">
                  <Star size={14} className="fill-amber-400 text-amber-400 mr-1.5" />
                  {doctor.rating || '5.0'}
                </div>
                <div className="font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-700">
                  {doctor.yearsOfExperience} years exp.
                </div>
              </div>

              <div className="mt-6 space-y-3 pt-6 border-t border-slate-50">
                <div className="flex items-center text-sm text-slate-500">
                  <Mail size={16} className="mr-3 text-slate-400" />
                  <span className="truncate">{doctor.user?.email}</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <Phone size={16} className="mr-3 text-slate-400" />
                  <span>{doctor.user?.phoneNumber || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => openProfile(doctor)}
                  className="btn btn-secondary flex-1 py-2 text-sm"
                >
                  Profile
                </button>
                <button className="btn btn-primary flex-1 py-2 text-sm shadow-indigo-100">Schedule</button>
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && doctors.length === 0 && (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <UserCheck size={24} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No doctors found</p>
          <p className="text-sm text-slate-500 mt-1">
            {search ? `No results for "${search}".` : 'Add your first doctor to get started.'}
          </p>
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="card !p-0 overflow-hidden shadow-sm border-slate-200">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={totalItems}
            limit={limit}
          />
        </div>
      )}

      {/* Add Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Add New Doctor</h2>
                <p className="text-sm text-slate-500">Register a new medical specialist</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="px-6 sm:px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">First Name</label>
                  <input required className="input h-11" placeholder="Dr. First Name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Last Name</label>
                  <input required className="input h-11" placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <input required type="email" className="input h-11" placeholder="doctor@aarogentix.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Phone Number</label>
                  <input required className="input h-11" placeholder="+91..." value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Doctor ID</label>
                  <input required className="input h-11 bg-slate-50" readOnly value={formData.doctorId} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Specialization</label>
                  <select required className="input h-11" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })}>
                    <option value="">Select Specialization</option>
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">License Number</label>
                  <input required className="input h-11" placeholder="e.g. MC12345" value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Experience (Yrs)</label>
                  <input required type="number" min="0" className="input h-11" value={formData.yearsOfExperience} onChange={e => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Consultation Fee (&#8377;)</label>
                  <input required type="number" min="0" className="input h-11" value={formData.consultationFee} onChange={e => setFormData({ ...formData, consultationFee: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1 h-12">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 h-12 shadow-indigo-100 disabled:opacity-50">{isSubmitting ? 'Registering...' : 'Register Doctor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Profile / Edit Modal */}
      {isProfileOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}
                </h2>
                <p className="text-sm text-slate-500">{selectedDoctor.specialization} &bull; {selectedDoctor.doctorId}</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="p-2 hover:bg-indigo-50 rounded-full transition-colors text-indigo-500"
                    title="Edit profile"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
                <button
                  onClick={() => { setIsProfileOpen(false); setIsEditMode(false); }}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {isEditMode ? (
              /* Edit Form */
              <form onSubmit={handleUpdateDoctor} className="px-6 sm:px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">First Name</label>
                    <input
                      required
                      className="input h-11"
                      value={editData.firstName}
                      onChange={e => setEditData({ ...editData, firstName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Last Name</label>
                    <input
                      required
                      className="input h-11"
                      value={editData.lastName}
                      onChange={e => setEditData({ ...editData, lastName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <input
                      required
                      type="email"
                      className="input h-11"
                      value={editData.email}
                      onChange={e => setEditData({ ...editData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Phone Number</label>
                    <input
                      className="input h-11"
                      value={editData.phoneNumber}
                      onChange={e => setEditData({ ...editData, phoneNumber: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Specialization</label>
                    <select
                      required
                      className="input h-11"
                      value={editData.specialization}
                      onChange={e => setEditData({ ...editData, specialization: e.target.value })}
                    >
                      <option value="">Select Specialization</option>
                      {SPECIALIZATIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">License Number</label>
                    <input
                      className="input h-11"
                      value={editData.licenseNumber}
                      onChange={e => setEditData({ ...editData, licenseNumber: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Experience (Yrs)</label>
                    <input
                      type="number"
                      min="0"
                      className="input h-11"
                      value={editData.yearsOfExperience}
                      onChange={e => setEditData({ ...editData, yearsOfExperience: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Consultation Fee (&#8377;)</label>
                    <input
                      type="number"
                      min="0"
                      className="input h-11"
                      value={editData.consultationFee}
                      onChange={e => setEditData({ ...editData, consultationFee: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Biography</label>
                    <textarea
                      className="input min-h-[90px] py-3"
                      placeholder="Brief professional biography..."
                      value={editData.biography}
                      onChange={e => setEditData({ ...editData, biography: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Status</label>
                    <select
                      className="input h-11"
                      value={editData.isActive ? 'active' : 'inactive'}
                      onChange={e => setEditData({ ...editData, isActive: e.target.value === 'active' })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="btn btn-secondary flex-1 h-12"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn btn-primary flex-1 h-12 shadow-indigo-100"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="px-6 sm:px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Avatar + name banner */}
                <div className="flex items-center gap-5 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="h-16 w-16 shrink-0 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl border border-indigo-200">
                    {selectedDoctor.user?.firstName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg">
                      Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}
                    </p>
                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{selectedDoctor.specialization}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`badge text-[10px] font-bold ${selectedDoctor.isActive ? 'badge-success' : 'badge-warning'}`}>
                        {selectedDoctor.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{selectedDoctor.doctorId}</span>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-1">
                    <div className="flex items-center bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-bold border border-amber-100 text-sm">
                      <Star size={13} className="fill-amber-400 text-amber-400 mr-1" />
                      {selectedDoctor.rating || '5.0'}
                    </div>
                    <p className="text-xs text-slate-500">{selectedDoctor.totalConsultations} consultations</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="text-sm text-slate-800 font-medium">{selectedDoctor.user?.email || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                    <p className="text-sm text-slate-800 font-medium">{selectedDoctor.user?.phoneNumber || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">License Number</p>
                    <p className="text-sm text-slate-800 font-medium font-mono">{selectedDoctor.licenseNumber || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience</p>
                    <p className="text-sm text-slate-800 font-medium">{selectedDoctor.yearsOfExperience ?? '—'} years</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consultation Fee</p>
                    <p className="text-sm text-slate-800 font-medium">&#8377;{selectedDoctor.consultationFee ?? '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">License Expiry</p>
                    <p className="text-sm text-slate-800 font-medium">
                      {selectedDoctor.licenseExpiry ? new Date(selectedDoctor.licenseExpiry).toLocaleDateString('en-IN') : '—'}
                    </p>
                  </div>
                  {selectedDoctor.qualifications?.length > 0 && (
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qualifications</p>
                      <p className="text-sm text-slate-800 font-medium">{selectedDoctor.qualifications.join(', ')}</p>
                    </div>
                  )}
                  {selectedDoctor.biography && (
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Biography</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{selectedDoctor.biography}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                  <button
                    type="button"
                    onClick={() => { setIsProfileOpen(false); setIsEditMode(false); }}
                    className="btn btn-secondary flex-1 h-12"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="btn btn-primary flex-1 h-12 gap-2"
                  >
                    <Edit2 size={16} />
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
