import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface VehicleStatusData {
  name: string;
  value: number;
  color: string;
}

interface VehicleStatusChartProps {
  available?: number;
  onTrip?: number;
  maintenance?: number;
  inactive?: number;
}

export const VehicleStatusChart: React.FC<VehicleStatusChartProps> = ({
  available = 0,
  onTrip = 0,
  maintenance = 0,
  inactive = 0,
}) => {
  const total = available + onTrip + maintenance + inactive;

  const data: VehicleStatusData[] = total > 0 ? [
    { name: 'Available', value: available, color: '#10B981' }, // emerald-500
    { name: 'In Transit', value: onTrip, color: '#2563EB' }, // blue-600
    { name: 'Maintenance', value: maintenance, color: '#F59E0B' }, // amber-500
    { name: 'Inactive / Idle', value: inactive, color: '#64748B' }, // slate-500
  ] : [
    { name: 'No registered vehicles', value: 1, color: '#E2E8F0' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Fleet Availability</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real-time status of {total} registered vehicles</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-navy-700 dark:text-navy-300 bg-navy-50 dark:bg-navy-950/60 px-2 py-1 rounded">
            {total > 0 ? Math.round(((available + onTrip) / total) * 100) : 0}% Active
          </span>
        </div>
      </div>

      <div className="h-[220px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={total > 0 ? 4 : 0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as VehicleStatusData;
                  const pct = Math.round((item.value / (total || 1)) * 100);
                  return (
                    <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700">
                      <div className="font-semibold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </div>
                      <div className="text-slate-300 mt-1 font-mono">
                        {item.value} Trucks ({pct}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium ml-1">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <span className="block text-2xl font-bold font-mono text-slate-800 dark:text-white leading-tight">
            {total}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Trucks</span>
        </div>
      </div>
    </div>
  );
};
