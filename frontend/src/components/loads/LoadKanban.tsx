import React from 'react';
import {
  Truck,
  MapPin,
  Share2,
  FileText,
  User,
  Clock,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';
import { Load } from '@/types/load.types';
import { formatINR, formatWeight } from '@/lib/utils/currency';

interface LoadKanbanProps {
  loads: Load[];
  onSelectLoad: (load: Load) => void;
  onGenerateLr?: (load: Load) => void;
  onShareWhatsApp?: (load: Load) => void;
}

const COLUMNS: { id: string; title: string; color: string; bg: string }[] = [
  { id: 'pending', title: 'Booked / Pending', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'dispatched', title: 'Dispatched', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'in_transit', title: 'In Transit', color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'delivered', title: 'Delivered (POD Due)', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'completed', title: 'Completed', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
];

export const LoadKanban: React.FC<LoadKanbanProps> = ({
  loads,
  onSelectLoad,
  onGenerateLr,
  onShareWhatsApp,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colLoads = loads.filter((l) => (l.status || 'pending').toLowerCase() === col.id);

        return (
          <div
            key={col.id}
            className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col min-w-[280px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.bg.replace('/10', '')}`} />
                <h4 className={`text-xs font-bold ${col.color}`}>{col.title}</h4>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
                {colLoads.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {colLoads.length === 0 ? (
                <div className="p-6 text-center text-[11px] text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No loads in this stage
                </div>
              ) : (
                colLoads.map((load) => (
                  <div
                    key={load.id}
                    onClick={() => onSelectLoad(load)}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer group"
                  >
                    {/* Card Top: ID & Freight */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-navy-900 dark:text-navy-100 group-hover:text-saffron-600 transition">
                        {load.load_number || load.id}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {formatINR(load.total_freight || 0)}
                      </span>
                    </div>

                    {/* Corridor */}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{load.origin_location?.name || 'Origin'}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{load.destination_location?.name || 'Destination'}</span>
                    </div>

                    {/* Consignor */}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-3">
                      {load.consignor?.name || 'Consignor Party'}
                    </p>

                    {/* Truck & Driver Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        <Truck className="w-3.5 h-3.5 text-saffron-500" />
                        <span>{load.vehicle?.plate_number || 'Unassigned'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onShareWhatsApp?.(load);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                          title="Share via WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerateLr?.(load);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="LR Status"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
