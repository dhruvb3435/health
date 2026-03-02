'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { FileText, Plus, User, UserCheck, Pill, MoreHorizontal, Search, Filter, X, Trash2, PlusCircle } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { Prescription, Patient, Doctor } from '@/types';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    diagnosis: '',
    notes: '',
    status: 'active',
    medicines: [
      { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]
  });

  const limit = 5;

  const fetchPrescriptions = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/prescriptions', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setPrescriptions(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch prescriptions', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      fetchPrescriptions(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchPrescriptions]);

  useEffect(() => {
    if (page > 1) {
      fetchPrescriptions(search, page);
    }
  }, [page, fetchPrescriptions]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const addMedicineRow = () => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedicineRow = (index: number) => {
    const newMedicines = formData.medicines.filter((_, i) => i !== index);
    setFormData({ ...formData, medicines: newMedicines });
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const newMedicines = [...formData.medicines];
    newMedicines[index] = { ...newMedicines[index], [field]: value };
    setFormData({ ...formData, medicines: newMedicines });
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/prescriptions', formData);
      toast.success('Prescription issued successfully');
      setIsModalOpen(false);
      setFormData({
        patientId: '',
        doctorId: '',
        diagnosis: '',
        notes: '',
        status: 'active',
        medicines: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]
      });
      fetchPrescriptions(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;
    try {
      await apiClient.delete(`/prescriptions/${id}`);
      toast.success('Prescription deleted');
      fetchPrescriptions(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Prescriptions</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Manage digital prescriptions and history</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11 shadow-indigo-100"
        >
          <Plus size={18} />
          New Prescription
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search prescriptions..."
            className="input pl-10 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary gap-2 h-11 justify-center sm:px-6 font-semibold">
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-slate-50 border-slate-100" />
          ))
        ) : (
          prescriptions.map((prescription) => (
            <div key={prescription.id} className="card group hover:border-indigo-200 transition-all hover:shadow-md bg-white border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-700 transition-colors">
                      Prescription #{prescription.prescriptionNumber}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Standard Medical Prescription • {new Date(prescription.issuedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${prescription.status === 'active' ? 'badge-success' : 'badge-primary'
                    }`}>
                    {prescription.status}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={() => handleDelete(prescription.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</p>
                    <p className="text-sm font-bold text-slate-900">
                      {prescription.patient?.user?.firstName} {prescription.patient?.user?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor</p>
                    <p className="text-sm font-bold text-slate-900 font-display">
                      Dr. {prescription.doctor?.user?.firstName} {prescription.doctor?.user?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1 lg:justify-end">
                  <button className="btn btn-secondary text-xs py-2 px-4 shadow-sm font-bold">View Details</button>
                  <button className="btn btn-primary text-xs py-2 px-4 shadow-indigo-100 font-bold">Download PDF</button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-2">
                {prescription.medicines?.map((med: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-default">
                    <Pill size={14} className="text-indigo-500" />
                    <span className="text-sm font-bold text-slate-700">{med.medicineName}</span>
                    <span className="text-xs text-slate-500 font-bold">• {med.dosage}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && prescriptions.length === 0 && (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm space-y-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No prescriptions found</p>
          <p className="text-sm text-slate-500">
            {search ? `No results for "${search}".` : 'Issue your first digital prescription to get started.'}
          </p>
        </div>
      )}

      {/* New Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">New Digital Prescription</h2>
                <p className="text-sm text-slate-500">Create and issue medication orders</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
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
                  <label className="text-sm font-bold text-slate-700">Doctor</label>
                  <select required className="input h-11" value={formData.doctorId} onChange={e => setFormData({ ...formData, doctorId: e.target.value })}>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.user?.firstName} {d.user?.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Diagnosis</label>
                  <input required className="input h-11" placeholder="Search or type diagnosis" value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Notes</label>
                  <input className="input h-11" placeholder="Extra instructions..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Medicines</h3>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-all font-display"
                  >
                    <PlusCircle size={16} />
                    Add Medicine
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.medicines.map((med, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="sm:col-span-2 lg:col-span-1">
                        <input required className="input text-sm h-10 w-full" placeholder="Medicine name" value={med.medicineName} onChange={e => updateMedicine(idx, 'medicineName', e.target.value)} />
                      </div>
                      <div>
                        <input required className="input text-sm h-10 w-full" placeholder="Dosage" value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} />
                      </div>
                      <div>
                        <input required className="input text-sm h-10 w-full" placeholder="1-0-1" value={med.frequency} onChange={e => updateMedicine(idx, 'frequency', e.target.value)} />
                      </div>
                      <div>
                        <input required className="input text-sm h-10 w-full" placeholder="5 Days" value={med.duration} onChange={e => updateMedicine(idx, 'duration', e.target.value)} />
                      </div>
                      <div className="flex gap-2 items-center">
                        <input className="input text-sm h-10 flex-1" placeholder="After meal" value={med.instructions} onChange={e => updateMedicine(idx, 'instructions', e.target.value)} />
                        {formData.medicines.length > 1 && (
                          <button type="button" onClick={() => removeMedicineRow(idx)} className="p-2 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors shrink-0">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            <div className="px-6 sm:px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1 h-12 font-bold">Cancel</button>
              <button
                type="submit"
                onClick={handleCreatePrescription}
                className="btn btn-primary flex-1 h-12 shadow-indigo-100 font-bold"
              >
                Issue Prescription
              </button>
            </div>
          </div>
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
    </div>
  );
}

