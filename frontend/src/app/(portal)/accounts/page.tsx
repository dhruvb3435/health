'use client';

import { useEffect, useState } from 'react';
import { useRequireRole } from '@/hooks/auth';
import { apiClient } from '@/lib/api-client';
import { PieChart, DollarSign, TrendingUp } from 'lucide-react';

export default function AccountsPage() {
  useRequireRole('admin', 'super_admin');
  const [summary, setSummary] = useState({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });
  const [_isLoading, _setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      _setIsLoading(true);
      try {
        const res = await apiClient.get('/accounts/financial-summary');
        setSummary(res.data);
      } catch (error) {
        console.error('Failed to fetch financial summary', error);
      }
      _setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Accounts & Finance</h1>
        <p className="mt-1 text-sm md:text-base text-slate-500">Manage expenses, revenue, and financial reports</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">₹{(summary.totalRevenue || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">₹{(summary.totalExpenses || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`card shadow-sm border-slate-200 sm:col-span-2 lg:col-span-1 ${summary.netProfit >= 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${summary.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <PieChart size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
              <p className={`text-xl md:text-2xl font-bold ${summary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                ₹{(summary.netProfit || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <div className="card shadow-sm border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Recent Expenses</h3>
          </div>
          <div className="p-6 text-center text-slate-500">
            Loading expenses...
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Revenue Breakdown</h3>
          </div>
          <div className="p-6 text-center text-slate-500">
            Loading revenue data...
          </div>
        </div>
      </div>
    </div>
  );
}
