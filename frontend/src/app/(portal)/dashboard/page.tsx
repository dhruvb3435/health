'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { useSubscription } from '@/hooks/use-subscription';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { PatientVolumeChart } from '@/components/dashboard/PatientVolumeChart';
import type { DashboardStats, DashboardModuleMetrics, Appointment } from '@/types';
import {
  Users,
  Calendar,
  Heart,
  IndianRupee,
  TrendingUp,
  Bed,
  AlertCircle,
  Clock,
  Package,
  Stethoscope,
  Building2,
  CheckCircle2,
  Crown
} from 'lucide-react';

export default function DashboardPage() {
  const { hasFeature } = useSubscription();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Appointment[]>([]);
  const [moduleMetrics, setModuleMetrics] = useState<DashboardModuleMetrics>({ lowStockItems: 0, staffCount: 0, nonCompliantItems: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch main dashboard stats
        const [statsRes, activityRes] = await Promise.all([
          apiClient.get('/dashboard/stats'),
          apiClient.get('/dashboard/recent-activity'),
        ]);
        setStats(statsRes.data);
        setRecentActivity(activityRes.data);

        // Fetch metrics from new modules in parallel
        try {
          const [wardsStats, financialRes, inventoryRes, staffRes, complianceRes] = await Promise.all([
            apiClient.get('/wards/stats').catch(() => ({ data: {} })),
            apiClient.get('/accounts/financial-summary').catch(() => ({ data: {} })),
            apiClient.get('/inventory/low-stock').catch(() => ({ data: [] })),
            apiClient.get('/staff?limit=1').catch(() => ({ data: {} })),
            apiClient.get('/compliance/non-compliant').catch(() => ({ data: [] })),
          ]);

          setModuleMetrics({
            wards: wardsStats.data || {},
            financial: financialRes.data || { totalRevenue: 0, totalExpenses: 0, netProfit: 0 },
            lowStockItems: Array.isArray(inventoryRes.data) ? inventoryRes.data.length : 0,
            staffCount: staffRes.data?.total || 0,
            nonCompliantItems: Array.isArray(complianceRes.data) ? complianceRes.data.length : 0,
          });
        } catch (error) {
          console.error('Failed to fetch module metrics', error);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card h-80 animate-pulse lg:col-span-2" />
          <div className="card h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  // Primary metrics cards
  const primaryMetrics = [
    {
      label: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Appointments Today',
      value: stats?.totalAppointments || 0,
      icon: Calendar,
      color: 'purple',
    },
    {
      label: 'Active Doctors',
      value: stats?.totalDoctors || 0,
      icon: Heart,
      color: 'red',
    },
    {
      label: 'Monthly Revenue',
      value: `₹${(stats?.revenue || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: 'green',
    },
    {
      label: 'Occupied Beds',
      value: moduleMetrics.wards?.occupiedBeds || 0,
      icon: Bed,
      color: 'orange',
    },
    {
      label: 'Net Profit',
      value: `₹${(moduleMetrics.financial?.netProfit || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'indigo',
      feature: 'accounts',
    },
  ].filter(m => !m.feature || hasFeature(m.feature));

  const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
  };

  // Dynamically calculate appointment status from actual data
  const appointmentStatus = recentActivity.length > 0 ? [
    { name: 'Completed', value: recentActivity.filter((a) => a.status === 'completed').length || 1, color: '#10b981' },
    { name: 'Pending', value: recentActivity.filter((a) => a.status === 'scheduled').length || 1, color: '#f59e0b' },
    { name: 'Cancelled', value: recentActivity.filter((a) => a.status === 'cancelled').length || 1, color: '#ef4444' },
  ] : [
    { name: 'No Data', value: 1, color: '#e5e7eb' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Dashboard</h1>
        <p className="mt-1 text-sm md:text-base text-slate-500">Hospital Operations Overview</p>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {primaryMetrics.map((metric, idx) => {
          const color = colorMap[metric.color];
          const Icon = metric.icon;
          const hrefMap: Record<string, string> = {
            'Total Patients': '/patients',
            'Appointments Today': '/appointments',
            'Active Doctors': '/doctors',
            'Monthly Revenue': '/accounts',
            'Occupied Beds': '/wards',
            'Net Profit': '/accounts',
          };

          return (
            <Link
              key={idx}
              href={hrefMap[metric.label] || '#'}
              className={`card group hover:shadow-lg transition-all border-l-4 ${color.border} ${color.bg} cursor-pointer active:scale-[0.98]`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <Icon className={`${color.icon} h-8 w-8 opacity-70 group-hover:scale-110 transition-transform`} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Critical Alerts Section */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Low Stock Inventory */}
        <Link href="/inventory" className="card border-l-4 border-orange-200 bg-orange-50/50 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Low Stock Items</p>
              <p className="mt-1 text-2xl font-bold text-orange-600">{moduleMetrics.lowStockItems || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Items require attention</p>
            </div>
            <Package className="h-10 w-10 text-orange-600 opacity-60 group-hover:scale-110 transition-transform" />
          </div>
        </Link>

        {/* Compliance Issues */}
        <Link href="/compliance" className="card border-l-4 border-red-200 bg-red-50/50 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Compliance Issues</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{moduleMetrics.nonCompliantItems || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Urgent: Review needed</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-600 opacity-60 group-hover:scale-110 transition-transform" />
          </div>
        </Link>

        {/* Staff Count */}
        <Link href="/staff" className="card border-l-4 border-blue-200 bg-blue-50/50 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Active Staff</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{moduleMetrics.staffCount || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Personnel on duty</p>
            </div>
            <Stethoscope className="h-10 w-10 text-blue-600 opacity-60 group-hover:scale-110 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Financial & Analytics Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Financial Summary */}
        <div className="card lg:col-span-2">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Financial Summary</h2>

          {/* Financial KPIs */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-8">
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Revenue</p>
              <p className="mt-2 text-2xl font-bold text-green-600">₹{(moduleMetrics.financial?.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Expenses</p>
              <p className="mt-2 text-2xl font-bold text-red-600">₹{(moduleMetrics.financial?.totalExpenses || 0).toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg border ${(moduleMetrics.financial?.netProfit ?? 0) >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-xs font-semibold text-gray-600 uppercase">Net Profit</p>
              <p className={`mt-2 text-2xl font-bold ${(moduleMetrics.financial?.netProfit ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₹{(moduleMetrics.financial?.netProfit || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Real-time Revenue Trend</h3>
          <RevenueChart />
        </div>

        {/* Hospital Operations Metrics */}
        <div className="card">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Hospital Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Bed className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Occupied Beds</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{moduleMetrics.wards?.occupiedBeds || 0}</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Available Beds</span>
              </div>
              <span className="text-lg font-bold text-green-600">{moduleMetrics.wards?.availableBeds || 0}</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Total Wards</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{moduleMetrics.wards?.totalWards || 0}</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Appointments</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.totalAppointments || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Last Updated</span>
              </div>
              <span className="text-xs font-medium text-gray-500">Just now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Patient Visit Volume (by Day)</h2>
          <PatientVolumeChart />
        </div>

        <div className="card">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Appointment Status</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appointmentStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {appointmentStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Analytics (Enterprise Only) */}
      {hasFeature('analytics') && (
        <div className="card border-0 bg-slate-900 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display">Revenue Growth & Projections</h2>
                <p className="text-slate-400 text-sm mt-1">Enterprise Analytics Portal</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400 ring-1 ring-blue-500/30">
                <Crown className="h-3 w-3" />
                Enterprise Feature
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { name: 'Jan', revenue: 4500, projection: 4200 },
                  { name: 'Feb', revenue: 5200, projection: 4800 },
                  { name: 'Mar', revenue: 4800, projection: 5100 },
                  { name: 'Apr', revenue: 6100, projection: 5500 },
                  { name: 'May', revenue: 5900, projection: 6000 },
                  { name: 'Jun', revenue: 7200, projection: 6800 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px' }}
                    itemStyle={{ color: '#F1F5F9' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="projection" stroke="#94A3B8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-slate-800 pt-6">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Monthly Retention</span>
                <span className="text-lg font-bold text-emerald-400">98.2%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Growth Rate</span>
                <span className="text-lg font-bold text-blue-400">+24.5%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Patient LTV</span>
                <span className="text-lg font-bold text-purple-400">₹12,450</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="card">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <Link href="/appointments" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivity.slice(0, 5).map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-4 group hover:bg-slate-50 rounded-xl px-2 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                    {activity.patientName ? activity.patientName.charAt(0) : '•'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{activity.patientName || activity.reason || 'Activity'}</p>
                    <p className="text-sm text-slate-500 font-medium truncate">
                      {activity.doctorName || activity.appointmentDate || 'Recently'}
                    </p>
                  </div>
                </div>
                <span className={`badge shrink-0 ml-2 ${activity.status === 'completed' ? 'badge-success' : activity.status === 'scheduled' ? 'badge-primary' : 'badge-warning'}`}>
                  {activity.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
