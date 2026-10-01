import React, { useState } from 'react';
import {
  MapPin,
  Truck,
  User,
  Share2,
  FileText,
  Printer,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  Package,
} from 'lucide-react';
import { Load } from '@/types/load.types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatINR, formatWeight } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';

interface LoadTableProps {
  loads: Load[];
  onSelectLoad: (load: Load) => void;
  onGenerateLr?: (load: Load) => void;
  onShareWhatsApp?: (load: Load) => void;
}

export const LoadTable: React.FC<LoadTableProps> = ({
  loads,
  onSelectLoad,
  onGenerateLr,
  onShareWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLoads = loads.filter((load) => {
    const matchesSearch =
      (load.load_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (load.consignor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (load.consignee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (load.vehicle?.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (load.eway_bill_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || (load.status || 'pending').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/60">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Load ID, Party, Plate, E-Way..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-navy-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'pending', 'dispatched', 'in_transit', 'delivered', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              {status === 'all' ? 'All Loads' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Load Ref</th>
              <th className="py-3 px-4">Route (Origin → Destination)</th>
              <th className="py-3 px-4">Parties (Consignor / Consignee)</th>
              <th className="py-3 px-4 hidden sm:table-cell">Vehicle & Driver</th>
              <th className="py-3 px-4 hidden md:table-cell">E-Way Bill #</th>
              <th className="py-3 px-4 text-right">Freight (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLoads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6">
                  <EmptyState
                    icon={Package}
                    title="No Loads Found"
                    description="Create your first consignment to get started"
                  />
                </td>
              </tr>
            ) : (
              filteredLoads.map((load) => (
                <tr
                  key={load.id}
                  onClick={() => onSelectLoad(load)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  {/* Load Ref & Type */}
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-navy-950 dark:text-white group-hover:text-saffron-600 transition">
                      {load.load_number || load.id}
                    </span>
                    <span className="block text-[10px] text-slate-400 uppercase font-sans mt-0.5">
                      {load.load_type || 'FTL'} • {load.service_type || 'Standard'}
                    </span>
                  </td>

                  {/* Route */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-semibold">{load.origin_location?.name || 'Mumbai JNPT'}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold">{load.destination_location?.name || 'Ahmedabad GIDC'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block ml-5 mt-0.5">
                      Dep: {formatDate(load.scheduled_pickup || new Date().toISOString())}
                    </span>
                  </td>

                  {/* Parties */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {load.consignor?.name || 'Consignor'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                      To: {load.consignee?.name || 'Consignee'}
                    </div>
                  </td>

                  {/* Vehicle & Driver */}
                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Truck className="w-3 h-3 text-saffron-500" />
                      {load.vehicle?.plate_number || 'Unassigned'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-blue-500" />
                      {load.driver?.name || 'Unassigned'}
                    </div>
                  </td>

                  {/* E-Way Bill */}
                  <td className="py-3.5 px-4 font-mono text-[11px] hidden md:table-cell">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {load.eway_bill_number || 'Not Recorded'}
                    </span>
                    {load.eway_bill_number && (
                      <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-sans mt-0.5">
                        Valid 48h
                      </span>
                    )}
                  </td>

                  {/* Freight */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatINR(load.total_freight || 0)}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-sans uppercase mt-0.5">
                      To Pay
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={load.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onShareWhatsApp?.(load)}
                        className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-600 transition"
                        title="Share via WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onGenerateLr?.(load)}
                        className="p-1.5 rounded-md hover:bg-navy-50 dark:hover:bg-navy-950/60 text-slate-400 hover:text-navy-900 dark:hover:text-white transition"
                        title="Generate LR"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onSelectLoad(load)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredLoads.length}</span> consignments
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px]">Indian Road Transport System</span>
        </div>
      </div>
    </div>
  );
};
