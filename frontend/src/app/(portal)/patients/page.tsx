'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Search, UserPlus, Filter, MoreHorizontal, X, Users } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { Patient } from '@/types';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bloodTypeFilter, setBloodTypeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    patientId: '',
    bloodType: 'A+',
    gender: 'Male',
    dateOfBirth: '',
    phoneNumber: '',
    insuranceProvider: ''
  });

  const limit = 10;

  const fetchPatients = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const params: any = { search: searchQuery, page: pageNumber, limit };
      if (bloodTypeFilter) params.bloodType = bloodTypeFilter;
      if (genderFilter) params.gender = genderFilter;
      const res = await apiClient.get('/patients', { params });
      setPatients(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch patients', error);
    } finally {
      setIsLoading(false);
    }
  }, [bloodTypeFilter, genderFilter]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const submissionData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth || undefined,
      };
      await apiClient.post('/patients', submissionData);
      toast.success('Patient registered successfully!');
      setIsAddModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        patientId: `PAT-${Math.floor(Math.random() * 100000)}`,
        bloodType: 'A+',
        gender: 'Male',
        dateOfBirth: '',
        phoneNumber: '',
        insuranceProvider: ''
      });
      fetchPatients(search, page);
    } catch {
      // handled by global interceptor
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPatients(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, bloodTypeFilter, genderFilter, fetchPatients]);

  useEffect(() => {
    if (page > 1) {
      fetchPatients(search, page);
    }
  }, [page, fetchPatients]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Patients</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Manage patient records and medical history</p>
        </div>
        <button
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11"
          onClick={() => {
            setFormData(prev => ({ ...prev, patientId: `PAT-${Math.floor(Math.random() * 100000)}` }));
            setIsAddModalOpen(true);
          }}
        >
          <UserPlus size={18} />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search patients by name or ID..."
              className="input pl-10 h-11 w-full"
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
            {(bloodTypeFilter || genderFilter) && (
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Type</label>
              <select
                className="input h-10 text-sm"
                value={bloodTypeFilter}
                onChange={(e) => setBloodTypeFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</label>
              <select
                className="input h-10 text-sm"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setBloodTypeFilter(''); setGenderFilter(''); }}
                className="btn btn-secondary h-10 px-4 text-xs font-bold"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Blood</th>
                <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="hidden lg:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 sm:px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />
                        <div className="space-y-2">
                          <div className="h-3.5 w-32 bg-slate-100 rounded" />
                          <div className="h-3 w-24 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4"><div className="h-3.5 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-4 sm:px-6 py-4"><div className="h-5 w-10 bg-slate-100 rounded-full" /></td>
                    <td className="hidden md:table-cell px-6 py-4"><div className="h-5 w-16 bg-slate-100 rounded-full" /></td>
                    <td className="hidden lg:table-cell px-6 py-4"><div className="h-3.5 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-4 sm:px-6 py-4" />
                  </tr>
                ))
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 shadow-sm text-sm">
                          {patient.user?.firstName?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                            {patient.user?.firstName} {patient.user?.lastName}
                          </p>
                          <p className="text-[10px] font-mono font-bold text-slate-400">{patient.patientId}</p>
                          {/* Show email inline on mobile since Contact column is hidden */}
                          <p className="sm:hidden text-xs text-slate-500 truncate mt-0.5">{patient.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <p className="text-sm text-slate-600 truncate max-w-[180px]">{patient.user?.email}</p>
                      {patient.user?.phoneNumber && (
                        <p className="text-xs text-slate-400 mt-0.5">{patient.user?.phoneNumber}</p>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="badge badge-primary font-bold text-[10px]">{patient.bloodType || '—'}</span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <span className="badge badge-success font-bold text-[10px]">Active</span>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-slate-600">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <button className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Empty State */}
          {!isLoading && patients.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Users size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No patients found</p>
              <p className="text-sm text-slate-500">
                {search ? `No results for "${search}". Try a different search.` : 'Add your first patient to get started.'}
              </p>
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

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Add New Patient</h2>
                <p className="text-sm text-slate-500">Register a new patient into the hospital system</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddPatient} className="px-6 sm:px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">First Name</label>
                  <input
                    required
                    type="text"
                    className="input h-11"
                    placeholder="e.g. Dhruv"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Last Name</label>
                  <input
                    required
                    type="text"
                    className="input h-11"
                    placeholder="e.g. Bagadiya"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <input
                    required
                    type="email"
                    className="input h-11"
                    placeholder="e.g. dhruv@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Patient ID</label>
                  <input
                    required
                    type="text"
                    className="input h-11 bg-slate-50"
                    readOnly
                    value={formData.patientId}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Blood Type</label>
                  <select
                    className="input h-11"
                    value={formData.bloodType}
                    onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                  >
                    <option>A+</option><option>A-</option>
                    <option>B+</option><option>B-</option>
                    <option>AB+</option><option>AB-</option>
                    <option>O+</option><option>O-</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Gender</label>
                  <select
                    className="input h-11"
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    className="input h-11"
                    placeholder="+91..."
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    className="input h-11"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Insurance Provider</label>
                  <input
                    type="text"
                    className="input h-11"
                    placeholder="e.g. Blue Cross"
                    value={formData.insuranceProvider}
                    onChange={e => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary flex-1 h-12"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 h-12"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
