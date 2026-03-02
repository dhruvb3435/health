'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { SkeletonCard } from '../ui/empty-state';

export function PatientVolumeChart() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get('/dashboard/analytics/volume');
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch patient volume analytics', error);
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
                <BarChart data={data.length > 0 ? data : [
                    { day: 'Mon', count: 0 },
                    { day: 'Tue', count: 0 }
                ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <Tooltip
                        cursor={{ fill: '#F1F5F9' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar
                        dataKey="count"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
