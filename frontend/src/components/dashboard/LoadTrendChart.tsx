import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTransportStore } from '@/stores/transport-data.store';

export const LoadTrendChart: React.FC = () => {
  const loads = useTransportStore((s) => s.loads);

  // Calculate real 7-day movement from registered consignments
  const data = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const name = dayNames[d.getDay()];
      const dateStr = d.toISOString().slice(0, 10);

      const matchingLoads = loads.filter((l) => {
        if (!l.created_at) return false;
        return l.created_at.slice(0, 10) === dateStr;
      });

      const deliveredCount = matchingLoads.filter(
        (l) => l.status === 'delivered' || l.status === 'completed'
      ).length;

      result.push({
        day: name,
        loads: matchingLoads.length,
        delivered: deliveredCount,
      });
    }
    return result;
  }, [loads]);

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight uppercase">Weekly Load Movement</h3>
          <p className="text-xs text-gray-500">Loads created vs delivered over past 7 days</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F2D56]" />
            <span className="text-gray-600">Dispatched</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            <span className="text-gray-600">Delivered</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F2D56" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0F2D56" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="accentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '0.75rem',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
              }}
            />
            <Area
              type="monotone"
              dataKey="loads"
              stroke="#0F2D56"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#primaryGradient)"
            />
            <Area
              type="monotone"
              dataKey="delivered"
              stroke="#F97316"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#accentGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
