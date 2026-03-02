'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { SkeletonCard } from '../ui/empty-state';

export function RevenueChart() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get('/dashboard/analytics/revenue');
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch revenue analytics', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) return <SkeletonCard className="h-80" />;

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.length > 0 ? data : [
                    { month: 'Jan', amount: 0 },
                    { month: 'Feb', amount: 0 }
                ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Tooltip
                        cursor={{ fill: '#F1F5F9' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 5 }}
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
