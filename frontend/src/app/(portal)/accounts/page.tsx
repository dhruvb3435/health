'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRequireRole } from '@/hooks/auth';
import { apiClient } from '@/lib/api-client';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  PieChart,
  ClipboardCheck,
  Plus,
  Search,
  X,
  Trash2,
  MoreHorizontal,
  Calendar,
  Download,
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';

interface Expense {
  id: string;
  expenseId?: string;
  type: string;
  description: string;
  amount: number;
  vendorName?: string;
  invoiceNumber?: string;
  expenseDate: string;
  dueDate?: string;
  status: string;
  createdAt: string;
}

interface RevenueEntry {
  id: string;
  transactionId?: string;
  source: string;
  patientName?: string;
  amount: number;
  date: string;
  status: string;
  createdAt: string;
}

export default function AccountsPage() {
  useRequireRole('admin', 'super_admin');

  const [activeTab, setActiveTab] = useState<'revenue' | 'expenses'>('revenue');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingApprovals: 0,
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'operational',
    description: '',
    amount: '',
    vendorName: '',
    invoiceNumber: '',
    expenseDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });

  const limit = 10;

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiClient.get('/accounts/financial-summary');
      setSummary({
        totalRevenue: res.data.totalRevenue || 0,
        totalExpenses: res.data.totalExpenses || 0,
        netProfit: res.data.netProfit || 0,
        pendingApprovals: res.data.pendingApprovals || 0,
      });
    } catch {
      // handled by global interceptor
    }
  }, []);

  const fetchExpenses = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        search: searchQuery,
        page: pageNumber,
        limit,
      };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await apiClient.get('/accounts/expenses', { params });
      setExpenses(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotalItems(res.data.meta?.total || 0);
    } catch {
      // handled by global interceptor
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchRevenue = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        search: searchQuery,
        page: pageNumber,
        limit,
      };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await apiClient.get('/accounts/revenue', { params });
      setRevenue(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotalItems(res.data.meta?.total || 0);
    } catch {
      // handled by global interceptor
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchData = useCallback((searchQuery = '', pageNumber = 1) => {
    if (activeTab === 'revenue') {
      fetchRevenue(searchQuery, pageNumber);
    } else {
      fetchExpenses(searchQuery, pageNumber);
    }
  }, [activeTab, fetchRevenue, fetchExpenses]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeTab, dateFrom, dateTo, fetchData]);

  useEffect(() => {
    if (page > 1) {
      fetchData(search, page);
    }
  }, [page, fetchData]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/accounts/expenses', {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
      });
      toast.success('Expense created successfully');
      setIsModalOpen(false);
      setFormData({
        type: 'operational',
        description: '',
        amount: '',
        vendorName: '',
        invoiceNumber: '',
        expenseDate: new Date().toISOString().split('T')[0],
        dueDate: '',
      });
      fetchData(search, page);
      fetchSummary();
    } catch {
      // handled by global interceptor
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await apiClient.delete(`/accounts/expenses/${id}`);
      toast.success('Expense deleted');
      fetchData(search, page);
      fetchSummary();
    } catch {
      // handled by global interceptor
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'received':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      case 'overdue':
      case 'failed':
        return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Accounts & Finance</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Manage expenses, revenue, and financial reports</p>
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
            Add Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card shadow-sm border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 text-slate-900 font-display">
                &#8377;{summary.totalRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Expenses</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 text-slate-900 font-display">
                &#8377;{summary.totalExpenses.toLocaleString()}
              </h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <TrendingDown size={20} />
            </div>
          </div>
        </div>

        <div className={`card shadow-sm p-6 ${summary.netProfit >= 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Profit</p>
              <h3 className={`text-2xl md:text-3xl font-bold mt-1 font-display ${summary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                &#8377;{summary.netProfit.toLocaleString()}
              </h3>
            </div>
            <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center ${summary.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <PieChart size={20} />
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Approvals</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 text-slate-900 font-display">
                {summary.pendingApprovals}
              </h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ClipboardCheck size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Search + Date Filters */}
      <div className="space-y-3">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => { setActiveTab('revenue'); setPage(1); }}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'revenue' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => { setActiveTab('expenses'); setPage(1); }}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'expenses' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Expenses
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={activeTab === 'revenue' ? 'Search revenue...' : 'Search expenses...'}
              className="input pl-10 h-11 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                className="input h-11 pl-10 text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                className="input h-11 pl-10 text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction ID</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Source</th>
                  <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="hidden lg:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 sm:px-6 py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                      <td className="hidden sm:table-cell px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="hidden md:table-cell px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                      <td className="px-4 sm:px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="hidden lg:table-cell px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-4 sm:px-6 py-4"><div className="h-5 w-16 bg-slate-100 rounded-full" /></td>
                    </tr>
                  ))
                ) : (
                  revenue.map((entry) => (
                    <tr key={entry.id} className="hover:bg-indigo-50/30 transition-colors group border-b border-slate-50 last:border-0">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm">
                            {entry.transactionId || entry.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="sm:hidden text-xs text-slate-500 mt-0.5">{entry.source}</p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{entry.source}</p>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <p className="text-sm text-slate-600">{entry.patientName || '-'}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm font-bold text-emerald-700">&#8377;{entry.amount?.toLocaleString()}</p>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-600">{new Date(entry.date || entry.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {!isLoading && revenue.length === 0 && (
              <div className="py-20 text-center bg-white space-y-3">
                <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <IndianRupee size={24} className="text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">No revenue records found</p>
                <p className="text-sm text-slate-500">
                  {search ? `No results for "${search}".` : 'Revenue records will appear here when transactions are made.'}
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
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Expense ID</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="hidden lg:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Vendor</th>
                  <th className="hidden xl:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 sm:px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="hidden sm:table-cell px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="hidden md:table-cell px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                      <td className="px-4 sm:px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="hidden lg:table-cell px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="hidden xl:table-cell px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-4 sm:px-6 py-4"><div className="h-5 w-16 bg-slate-100 rounded-full" /></td>
                      <td className="px-4 sm:px-6 py-4" />
                    </tr>
                  ))
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-indigo-50/30 transition-colors group border-b border-slate-50 last:border-0">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm">
                            {expense.expenseId || `EXP-${expense.id.slice(0, 6).toUpperCase()}`}
                          </p>
                          <p className="sm:hidden text-xs text-slate-500 mt-0.5 capitalize">{expense.type}</p>
                          <p className="md:hidden text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{expense.description}</p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                          {expense.type}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <p className="text-sm text-slate-600 truncate max-w-[200px]">{expense.description}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm font-bold text-rose-700">&#8377;{expense.amount?.toLocaleString()}</p>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4">
                        <p className="text-sm text-slate-600">{expense.vendorName || '-'}</p>
                      </td>
                      <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-600">{new Date(expense.expenseDate || expense.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(expense.status)}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
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

            {!isLoading && expenses.length === 0 && (
              <div className="py-20 text-center bg-white space-y-3">
                <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <TrendingDown size={24} className="text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">No expenses found</p>
                <p className="text-sm text-slate-500">
                  {search ? `No results for "${search}".` : 'Add your first expense to start tracking.'}
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
      )}

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Add Expense</h2>
                <p className="text-sm text-slate-500">Record a new expense entry</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="px-6 sm:px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Expense Type</label>
                  <select
                    required
                    className="input h-11"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="operational">Operational</option>
                    <option value="salary">Salary</option>
                    <option value="equipment">Equipment</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="utilities">Utilities</option>
                    <option value="supplies">Supplies</option>
                    <option value="insurance">Insurance</option>
                    <option value="rent">Rent</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Amount ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    className="input h-11"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <input
                    required
                    type="text"
                    className="input h-11"
                    placeholder="Brief description of the expense"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Vendor Name</label>
                  <input
                    type="text"
                    className="input h-11"
                    placeholder="e.g. Medical Supplies Co."
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Invoice #</label>
                  <input
                    type="text"
                    className="input h-11"
                    placeholder="e.g. INV-2026-001"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Expense Date</label>
                  <input
                    required
                    type="date"
                    className="input h-11"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    className="input h-11"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
