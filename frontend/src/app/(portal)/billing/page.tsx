'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { FileText, Plus, Search, Filter, MoreHorizontal, Download, IndianRupee, CreditCard, X, Trash2, PlusCircle } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { Invoice, Patient, Admission } from '@/types';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'admissions'>('invoices');
  const [activeAdmissions, setActiveAdmissions] = useState<Admission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    status: 'pending',
    billingDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discount: 0,
    taxRate: 10,
    paidAmount: 0,
    notes: '',
    lineItems: [
      { description: 'Consultation Fee', quantity: 1, unitPrice: 500, total: 500 }
    ]
  });

  const limit = 10;

  const fetchInvoices = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/billing/invoices', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setInvoices(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch {
      // handled by global interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    try {
      const res = await apiClient.get('/patients', { params: { limit: 100 } });
      setPatients(res.data.data || []);
    } catch {
      // handled by global interceptor
    }
  }, []);

  const fetchActiveAdmissions = useCallback(async () => {
    try {
      const res = await apiClient.get('/admissions', { params: { limit: 100 } });
      // Only show admitted/active ones
      setActiveAdmissions(res.data.data?.filter((a: any) => a.status === 'admitted') || []);
    } catch {
      // handled by global interceptor
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchInvoices(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchInvoices]);

  useEffect(() => {
    if (page > 1) {
      fetchInvoices(search, page);
    }
  }, [page, fetchInvoices]);

  useEffect(() => {
    fetchDependencies();
    fetchActiveAdmissions();
  }, [fetchDependencies, fetchActiveAdmissions]);

  const totals = useMemo(() => {
    const subtotal = formData.lineItems.reduce((acc, item) => acc + item.total, 0);
    const discountAmount = formData.discount;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * formData.taxRate) / 100;
    const total = taxableAmount + taxAmount;
    const dueAmount = total - formData.paidAmount;
    return { subtotal, taxAmount, total, dueAmount };
  }, [formData]);

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const removeLineItem = (index: number) => {
    const newItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: newItems });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.lineItems];
    const item = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      item.total = item.quantity * item.unitPrice;
    }

    newItems[index] = item;
    setFormData({ ...formData, lineItems: newItems });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.total,
        dueAmount: totals.dueAmount
      };
      await apiClient.post('/billing/invoices', payload);
      toast.success('Invoice created successfully');
      setIsModalOpen(false);
      setFormData({
        patientId: '',
        status: 'pending',
        billingDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        discount: 0,
        taxRate: 10,
        paidAmount: 0,
        notes: '',
        lineItems: [{ description: 'Consultation Fee', quantity: 1, unitPrice: 500, total: 500 }]
      });
      fetchInvoices(search, page);
    } catch {
      // handled by global interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateIPDInvoice = async (admissionId: string) => {
    try {
      const res = await apiClient.get(`/admissions/${admissionId}/billing`);
      const { patient, stayDuration, wardRate, estimatedStayCharges } = res.data;

      setFormData({
        patientId: patient.id,
        status: 'pending',
        billingDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        discount: 0,
        taxRate: 10,
        paidAmount: 0,
        notes: `IPD Stay: ${stayDuration} days in ${patient.ward?.wardName || 'Ward'}.`,
        lineItems: [
          {
            description: `Bed Charges (${stayDuration} days @ \u20B9${wardRate}/day)`,
            quantity: stayDuration,
            unitPrice: wardRate,
            total: estimatedStayCharges
          }
        ]
      });
      setIsModalOpen(true);
    } catch {
      // handled by global interceptor
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await apiClient.delete(`/billing/invoices/${id}`);
      toast.success('Invoice deleted');
      fetchInvoices(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Billing</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Manage invoices, payments and financial records</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button className="btn btn-secondary gap-2 flex-1 sm:flex-none justify-center h-11 border-slate-200">
            <Download size={18} />
            <span>Export</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary gap-2 flex-1 sm:flex-none justify-center h-11 shadow-indigo-100"
          >
            <Plus size={18} />
            Create Invoice
          </button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card bg-indigo-600 text-white border-none shadow-indigo-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Total Outstanding</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 font-display">
                &#8377;{invoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <IndianRupee size={20} />
            </div>
          </div>
        </div>
        <div className="card bg-emerald-600 text-white border-none shadow-emerald-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Total Revenue</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 font-display">
                &#8377;{invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
          </div>
        </div>
        <div className="card bg-white border-slate-200 shadow-sm sm:col-span-2 lg:col-span-1 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Pending Invoices</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 text-slate-900 font-display">
                {invoices.filter(inv => inv.status === 'pending').length}
              </h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <FileText size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'invoices' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('admissions')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'admissions' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Active Admissions
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={activeTab === 'invoices' ? 'Search invoices...' : 'Search patients...'}
              className="input pl-10 h-11 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary gap-2 h-11 justify-center sm:px-6 font-bold">
            <Filter size={18} />
            Filters
          </button>
        </div>
      </div>

      {activeTab === 'invoices' ? (
        <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice / Date</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Details</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 sm:px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="hidden sm:table-cell px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                      <td className="px-4 sm:px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="hidden md:table-cell px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-4 sm:px-6 py-4 text-right" />
                    </tr>
                  ))
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-indigo-50/30 transition-colors group border-b border-slate-50 last:border-0">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm sm:text-base">
                            INV-{invoice.invoiceNumber || '2026-001'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </p>
                          {/* Show patient name inline on mobile since Patient column is hidden */}
                          <p className="sm:hidden text-xs text-slate-500 mt-0.5 truncate">
                            {invoice.patient?.user?.firstName} {invoice.patient?.user?.lastName}
                          </p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="h-8 w-8 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-[10px] text-indigo-600 shadow-sm border border-indigo-100">
                            {invoice.patient?.user?.firstName?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-700 truncate">
                              {invoice.patient?.user?.firstName} {invoice.patient?.user?.lastName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">
                              {invoice.patient?.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900">
                        &#8377;{invoice.totalAmount?.toLocaleString()}
                        {/* Show status inline on mobile since Status column is hidden */}
                        <span className={`md:hidden ml-2 badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'
                          } font-bold text-[10px]`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <span className={`badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'
                          } font-bold text-[10px]`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDelete(invoice.id)}
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

            {!isLoading && invoices.length === 0 && (
              <div className="py-20 text-center bg-white space-y-3">
                <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText size={24} className="text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">No invoices found</p>
                <p className="text-sm text-slate-500">
                  {search ? `No results for "${search}".` : 'Create your first invoice to get started.'}
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
      ) : (
        <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Admission / Patient</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Ward / Rate</th>
                  <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Stay Duration</th>
                  <th className="px-4 sm:px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activeAdmissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500">
                          {adm.patient?.user?.firstName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{adm.admissionId}</p>
                          <p className="text-sm text-slate-700 truncate">{adm.patient?.user?.firstName} {adm.patient?.user?.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Bed {adm.bed?.bedNumber}
                          </p>
                          {/* Show ward and duration inline on mobile */}
                          <div className="sm:hidden text-xs text-slate-500 mt-0.5">
                            {adm.ward?.wardName} - {Math.ceil((new Date().getTime() - new Date(adm.admissionDate).getTime()) / (1000 * 60 * 60 * 24)) || 1} days
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">{adm.ward?.wardName}</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-widest">&#8377;{adm.ward?.pricePerDay || 0}/day</p>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <span className="text-sm font-bold text-indigo-600">
                        {Math.ceil((new Date().getTime() - new Date(adm.admissionDate).getTime()) / (1000 * 60 * 60 * 24)) || 1} days
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <button
                        onClick={() => handleGenerateIPDInvoice(adm.id)}
                        className="btn btn-secondary h-9 px-3 sm:px-4 text-xs gap-1.5 sm:gap-2 font-bold"
                      >
                        <IndianRupee size={14} />
                        <span className="hidden sm:inline">Invoice Stay</span>
                        <span className="sm:hidden">Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {activeAdmissions.length === 0 && (
              <div className="py-20 text-center bg-white">
                <p className="text-slate-500 font-medium font-display">No active IPD admissions found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="create-invoice-title">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 shrink-0">
              <div>
                <h2 id="create-invoice-title" className="text-xl font-bold text-slate-900 font-display">Create Invoice</h2>
                <p className="text-sm text-slate-500">Generate a new billing record for patient</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-7">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  <label className="text-sm font-bold text-slate-700">Billing Date</label>
                  <input type="date" required className="input h-11" value={formData.billingDate} onChange={e => setFormData({ ...formData, billingDate: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Due Date</label>
                  <input type="date" required className="input h-11" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Line Items</h3>
                  <button type="button" onClick={addLineItem} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-all font-display">
                    <PlusCircle size={16} /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.lineItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group">
                      <div className="flex-[3] space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                        <input required className="input h-10 text-sm" placeholder="Service description" value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Qty</label>
                        <input type="number" required className="input h-10 text-sm" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', parseInt(e.target.value))} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Price (&#8377;)</label>
                        <input type="number" required className="input h-10 text-sm" value={item.unitPrice} onChange={e => updateLineItem(idx, 'unitPrice', parseInt(e.target.value))} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Total</label>
                        <div className="h-10 flex items-center px-3 font-bold text-slate-900 border border-transparent self-end">&#8377;{item.total.toLocaleString()}</div>
                      </div>
                      <div className="flex items-end pb-2">
                        {formData.lineItems.length > 1 && (
                          <button type="button" onClick={() => removeLineItem(idx)} className="p-2 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Special Notes</label>
                    <textarea className="input min-h-[120px] py-3 text-sm" placeholder="Terms and conditions or payment info..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-6 space-y-3 border border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="font-bold text-slate-900">&#8377;{totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Discount (&#8377;)</span>
                    </div>
                    <input type="number" className="w-20 text-right bg-transparent border-b border-indigo-200 outline-none font-bold text-indigo-600" value={formData.discount} onChange={e => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Tax Rate (%)</span>
                    <input type="number" className="w-20 text-right bg-transparent border-b border-indigo-200 outline-none font-bold text-indigo-600" value={formData.taxRate} onChange={e => setFormData({ ...formData, taxRate: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between">
                    <span className="text-base font-bold text-slate-900 font-display">Grand Total</span>
                    <span className="text-xl font-bold text-indigo-600 font-display">&#8377;{totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </form>

            <div className="px-6 sm:px-8 py-5 sm:py-6 border-t border-slate-100 bg-white flex gap-3 sm:gap-4 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1 h-12 font-bold">Cancel</button>
              <button
                type="button"
                onClick={handleCreateInvoice}
                disabled={isSubmitting}
                className="btn btn-primary flex-1 h-12 shadow-indigo-100 font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Finalize & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
