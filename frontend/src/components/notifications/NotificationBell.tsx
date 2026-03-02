'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, X, AlertCircle, Calendar, DollarSign, Package, Settings } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: Record<string, any>;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    appointment: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    billing: { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    inventory: { icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
    alert: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    system: { icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50' },
    onboarding: { icon: Check, color: 'text-purple-600', bg: 'bg-purple-50' },
};

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchCount = useCallback(async () => {
        try {
            const res = await apiClient.get('/notifications/count');
            setUnreadCount(res.data.count || 0);
        } catch { /* silent */ }
    }, []);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/notifications?limit=10');
            setNotifications(res.data || []);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, []);

    // Poll every 30s
    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    // Fetch details when opened
    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAllRead = async () => {
        try {
            await apiClient.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const markRead = async (id: string) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(p => !p)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                aria-label="Notifications"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/60 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-slate-700" />
                                <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                    >
                                        <CheckCheck className="h-3.5 w-3.5" /> All read
                                    </button>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-80 overflow-y-auto">
                            {loading ? (
                                <div className="space-y-2 p-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                                                <div className="h-2.5 bg-slate-100 rounded animate-pulse w-full" />
                                                <div className="h-2 bg-slate-100 rounded animate-pulse w-1/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 mb-3">
                                        <Bell className="h-6 w-6 text-slate-300" />
                                    </div>
                                    <p className="font-semibold text-slate-700 text-sm">All caught up!</p>
                                    <p className="text-xs text-slate-400 mt-1">New notifications will appear here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map(notification => {
                                        const config = typeConfig[notification.type] || typeConfig.system;
                                        const Icon = config.icon;
                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => !notification.isRead && markRead(notification.id)}
                                                className={`flex gap-3 p-4 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50/30 hover:bg-blue-50/60' : 'hover:bg-slate-50'}`}
                                            >
                                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                                                    <Icon className={`h-4 w-4 ${config.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm font-semibold text-slate-900 leading-tight ${!notification.isRead ? 'font-bold' : ''}`}>
                                                            {notification.title}
                                                        </p>
                                                        {!notification.isRead && (
                                                            <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                                                    <p className="mt-1 text-[10px] font-medium text-slate-400">{timeAgo(notification.createdAt)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
                            <Link
                                href="/notifications"
                                onClick={() => setOpen(false)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                View all notifications
                            </Link>
                            <Link
                                href="/settings"
                                onClick={() => setOpen(false)}
                                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Settings
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
