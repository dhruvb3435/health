'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Bell, CheckCheck, Calendar, Wallet, AlertTriangle, Package, Settings } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { Notification } from '@/types';

type FilterTab = 'all' | 'unread' | 'appointment' | 'billing' | 'system' | 'alert';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  appointment: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-500' },
  billing: { icon: Wallet, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-500' },
  inventory: { icon: Package, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500' },
  alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500' },
  system: { icon: Settings, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-400' },
  onboarding: { icon: CheckCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-500' },
};

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'appointment', label: 'Appointments' },
  { key: 'billing', label: 'Billing' },
  { key: 'system', label: 'System' },
  { key: 'alert', label: 'Alerts' },
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const limit = 20;

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications/count');
      setUnreadCount(res.data.count || 0);
    } catch {
      // handled by global interceptor
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNumber = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        limit,
        page: pageNumber,
      };
      if (activeFilter === 'unread') {
        params.isRead = false;
      } else if (activeFilter !== 'all') {
        params.type = activeFilter;
      }
      const res = await apiClient.get('/notifications', { params });
      const data: Notification[] = res.data.data || res.data || [];
      setNotifications(data);
      setTotalPages(res.data.meta?.totalPages || Math.ceil((res.data.meta?.total || data.length) / limit) || 1);
      setTotalItems(res.data.meta?.total || data.length);
    } catch {
      // handled by global interceptor
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1);
    fetchUnreadCount();
  }, [activeFilter, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (page > 1) {
      fetchNotifications(page);
    }
  }, [page, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // handled by global interceptor
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      // handled by global interceptor
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Notifications</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Stay updated with alerts, reminders and system messages</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary gap-2 w-full sm:w-auto justify-center h-11 font-bold"
          >
            <CheckCheck size={18} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Unread Count Summary */}
      <div className="card shadow-sm border-slate-200 p-5 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
            <Bell size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unread</p>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-bold text-slate-900 font-display">{unreadCount}</span>
              {unreadCount > 0 && (
                <span className="badge badge-primary text-[9px] font-bold">Requires attention</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-full overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeFilter === tab.key
                ? 'bg-white shadow-sm text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 sm:p-5 animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center bg-white space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
              <Bell size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No notifications found</p>
            <p className="text-sm text-slate-500">
              {activeFilter !== 'all'
                ? 'No notifications match this filter.'
                : 'When you receive notifications, they will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {notifications.map(notification => {
                const config = typeConfig[notification.type] || typeConfig.system;
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                    className={`flex gap-4 p-4 sm:p-5 transition-colors cursor-pointer border-l-[3px] ${
                      !notification.isRead
                        ? `bg-white ${config.border} hover:bg-slate-50`
                        : 'bg-slate-50/60 border-transparent hover:bg-slate-100/60'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight text-slate-900 ${!notification.isRead ? 'font-bold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                            {timeAgo(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color}`}>
                          {notification.type}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
          </>
        )}
      </div>
    </div>
  );
}
