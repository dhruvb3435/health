'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { UserCheck, Star, Mail, Phone, MoreVertical, Search, Filter, X, Trash2 } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { Doctor } from '@/types';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
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
      const res = await apiClient.get('/doctors', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setDoctors(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error: any) {
      console.error('Failed to fetch doctors', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchDoctors(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchDoctors]);

  useEffect(() => {
    if (page > 1) {
      fetchDoctors(search, page);
    }
  }, [page, fetchDoctors]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <button className="btn btn-secondary gap-2 h-11 justify-center sm:px-6">
          <Filter size={18} />
          Filters
        </button>
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
                <button className="btn btn-secondary flex-1 py-2 text-sm">Profile</button>
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
                  <input required className="input h-11" placeholder="+1234567890" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Doctor ID</label>
                  <input required className="input h-11 bg-slate-50" readOnly value={formData.doctorId} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Specialization</label>
                  <select required className="input h-11" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })}>
                    <option value="">Select Specialization</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Physiotherapy">Physiotherapy</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">License Number</label>
                  <input required className="input h-11" placeholder="e.g. MC12345" value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Experience (Yrs)</label>
                  <input required type="number" className="input h-11" value={formData.yearsOfExperience} onChange={e => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Consultation Fee ($)</label>
                  <input required type="number" className="input h-11" value={formData.consultationFee} onChange={e => setFormData({ ...formData, consultationFee: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1 h-12">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1 h-12 shadow-indigo-100">Register Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

