import React, { useState } from 'react';
import {
  X,
  MapPin,
  Truck,
  User,
  Calendar,
  IndianRupee,
  FileText,
  Download,
  Receipt,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Building2,
  Printer,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { Load } from '@/types/load.types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WhatsAppShareButton } from '@/components/shared/WhatsAppShareButton';
import { PdfPreviewDrawer } from '@/components/shared/PdfPreviewDrawer';
import {
  downloadLoadingSlipPdf,
  downloadTripMemoPdf,
  downloadBiltyPdf,
  downloadLrPdf,
} from '@/lib/pdf-downloader';
import { formatINR, formatWeight } from '@/lib/utils/currency';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { toast } from 'sonner';

interface LoadDetailDrawerProps {
  load: Load | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateLr?: (load: Load) => void;
  onCreateBilty?: (load: Load) => void;
}

export const LoadDetailDrawer: React.FC<LoadDetailDrawerProps> = ({
  load,
  isOpen,
  onClose,
  onGenerateLr,
  onCreateBilty,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'goods' | 'docs' | 'freight' | 'stops' | 'timeline'>('overview');
  const [pdfPreviewType, setPdfPreviewType] = useState<'lr' | 'bilty' | 'challan' | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  if (!isOpen || !load) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'goods', label: 'Goods & E-Way' },
    { id: 'docs', label: 'Documents' },
    { id: 'freight', label: 'Freight & Billing' },
    { id: 'stops', label: 'Stops & Route' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-navy-900 dark:text-navy-100">
                  {load.load_number || load.id}
                </span>
                <StatusBadge status={load.status} />
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                  {load.load_type || 'FTL'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Booked on {formatDateTime(load.created_at || new Date().toISOString())}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWhatsApp(true)}
              className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition"
              title="Share via WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Ribbon */}
        <div className="px-5 py-2.5 bg-navy-50/80 dark:bg-navy-950/50 border-b border-navy-100 dark:border-navy-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-navy-800 dark:text-navy-200">
            <ShieldCheck className="w-4 h-4 text-saffron-500" />
            <span>Fast Action:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                downloadLoadingSlipPdf({
                  slipNo: String(load.load_number || load.id || ''),
                  toName: load.consignor?.name,
                  truckNo: load.vehicle?.plate_number,
                  station: load.destination_location?.name,
                  weight: (load as any).total_weight || '28.5 MT',
                  advance: load.advance_amount,
                  balance: (load.total_freight || 0) - (load.advance_amount || 0),
                });
              }}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1"
              title="Download Official Loading Slip (PDF)"
            >
              <FileText className="w-3.5 h-3.5" />
              Loading Slip
            </button>

            <button
              onClick={() => {
                downloadTripMemoPdf({
                  memoNo: `MEMO-${String(load.load_number || load.id).replace(/[^0-9]/g, '')}`,
                  from: load.origin_location?.name,
                  to: load.destination_location?.name,
                  truckNo: load.vehicle?.plate_number,
                  driverName: load.driver?.name,
                  driverPhone: load.driver?.phone,
                  transporterName: load.consignor?.name,
                  freight: load.total_freight,
                  advance: load.advance_amount,
                  balance: (load.total_freight || 0) - (load.advance_amount || 0),
                });
              }}
              className="px-2.5 py-1 rounded bg-accent hover:bg-accent/90 text-white text-xs font-bold shadow-xs transition flex items-center gap-1"
              title="Download Trip Memo Challan (PDF)"
            >
              <Receipt className="w-3.5 h-3.5" />
              Trip Memo
            </button>

            {load.lr_number ? (
              <button
                onClick={() => setPdfPreviewType('lr')}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-navy-800 dark:text-navy-200 hover:bg-slate-50 transition flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5 text-saffron-500" />
                LR: {load.lr_number.lr_number}
              </button>
            ) : (
              <button
                onClick={() => onGenerateLr?.(load)}
                className="px-2.5 py-1 rounded bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                Generate LR
              </button>
            )}

            {load.bilty ? (
              <button
                onClick={() => setPdfPreviewType('bilty')}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-navy-800 dark:text-navy-200 hover:bg-slate-50 transition flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5 text-blue-500" />
                Bilty: {load.bilty.bilty_number}
              </button>
            ) : (
              <button
                onClick={() => onCreateBilty?.(load)}
                className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1"
              >
                Create Bilty
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-saffron-500 text-saffron-600 dark:text-saffron-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Route Summary Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Transport Corridor
                </span>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{load.origin_location?.name || 'Origin City'}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 ml-5.5 mt-0.5">
                      {load.origin_location?.address || 'Pickup Point'}
                    </p>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    <span className="text-[10px] text-slate-400 font-mono">Corridor Transit</span>
                    <div className="w-24 h-0.5 bg-slate-300 dark:bg-slate-700 relative my-1">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 px-1">
                        <Truck className="w-3.5 h-3.5 text-saffron-500" />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Approx. 450 km</span>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                      <span>{load.destination_location?.name || 'Destination City'}</span>
                      <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mr-5.5 mt-0.5">
                      {load.destination_location?.address || 'Dropoff Point'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Consignor & Consignee Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Consignor */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Consignor (Sender)</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {load.consignor?.name || 'Consignor Company Ltd'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {load.consignor?.address || 'Warehouse 4, Industrial Area, Mumbai'}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">GSTIN:</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {load.consignor?.gstin || '27AABCU9603R1ZM'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {load.consignor?.phone || '+91 98200 11223'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consignee */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Consignee (Receiver)</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {load.consignee?.name || 'Consignee Enterprises'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {load.consignee?.address || 'Plot 12, Logistic Hub, Bhiwandi'}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">GSTIN:</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {load.consignee?.gstin || '27BBACU8811K1Z2'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {load.consignee?.phone || '+91 98110 33445'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle & Driver Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-navy-600 dark:text-navy-400" />
                      Assigned Vehicle
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      GPS Active
                    </span>
                  </div>
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    {load.vehicle?.plate_number || 'Unassigned'}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {load.vehicle?.make || 'Fleet Truck'} {load.vehicle?.model || ''}
                  </p>
                </div>

                {/* Driver */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      Driver on Duty
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {load.driver?.name ? 'Assigned' : 'Unassigned'}
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {load.driver?.name || 'Unassigned'}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="font-mono font-medium">{load.driver?.phone || 'No phone recorded'}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{(load.driver as any)?.driving_licence_number ? `DL: ${(load.driver as any).driving_licence_number}` : 'DL: On File'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOODS & E-WAY BILL */}
          {activeTab === 'goods' && (
            <div className="space-y-4">
              {/* E-Way Bill Box */}
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      Government GST E-Way Bill
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Valid (48h Remaining)
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">E-Way Bill No</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {load.eway_bill_number || 'Not Recorded'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Generated Date</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {formatDate(load.created_at || new Date().toISOString())}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Valid Until</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {load.eway_bill_number ? formatDate(new Date(Date.now() + 2 * 86400000).toISOString()) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Declared Goods Value</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatINR(load.total_declared_value || load.total_freight || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Item Description</th>
                      <th className="py-3 px-4">Package Type</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4 text-right">Weight (MT)</th>
                      <th className="py-3 px-4 text-right">Declared (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {(load as any).cargo_description || (load as any).goods_description || 'General Consignment Freight'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {(load as any).package_type || 'Standard Packages / Pallets'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {(load as any).total_packages || (load as any).quantity || 1} Units
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {(load as any).weight_mt || (load as any).weight || (load.vehicle as any)?.capacity_tonnage || 0} MT
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {formatINR(load.total_declared_value || load.total_freight || 0)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50/70 dark:bg-slate-800/50 font-bold border-t border-slate-200 dark:border-slate-800">
                    <tr>
                      <td className="py-3 px-4" colSpan={2}>
                        Total Consignment Load
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {(load as any).total_packages || (load as any).quantity || 1} Units
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {(load as any).weight_mt || (load as any).weight || (load.vehicle as any)?.capacity_tonnage || 0} MT
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-saffron-600">
                        {formatINR(load.total_declared_value || load.total_freight || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* LR Document */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-saffron-50 dark:bg-saffron-950/50 rounded-lg text-saffron-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Lorry Receipt (LR)
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500">
                        {load.lr_number?.lr_number || (load.load_number ? `LR-${load.load_number.replace(/[^0-9]/g, '') || '001'}` : 'Pending Generation')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPdfPreviewType('lr')}
                    className="px-3 py-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 dark:bg-navy-950 dark:hover:bg-navy-900 text-navy-800 dark:text-navy-200 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    View PDF
                  </button>
                </div>

                {/* Bilty Document */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Consignment Bilty
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500">
                        {load.bilty?.bilty_number || (load.load_number ? `BL-${load.load_number.replace(/[^0-9]/g, '') || '001'}` : 'Pending Generation')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPdfPreviewType('bilty')}
                    className="px-3 py-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 dark:bg-navy-950 dark:hover:bg-navy-900 text-navy-800 dark:text-navy-200 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    View PDF
                  </button>
                </div>

                {/* Delivery Challan */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 rounded-lg text-purple-600">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Delivery Challan
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500">
                        {load.load_number ? `DC-${load.load_number.replace(/[^0-9]/g, '') || '001'}` : 'Pending Generation'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPdfPreviewType('challan')}
                    className="px-3 py-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 dark:bg-navy-950 dark:hover:bg-navy-900 text-navy-800 dark:text-navy-200 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    View PDF
                  </button>
                </div>

                {/* POD (Proof of Delivery) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Proof of Delivery (POD)
                      </h4>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Pending Receiver Stamp
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info('Please drag and drop signed receiver copy')}
                    className="px-3 py-1.5 rounded-lg bg-saffron-50 hover:bg-saffron-100 text-saffron-700 text-xs font-semibold transition"
                  >
                    Upload POD
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FREIGHT & BILLING */}
          {activeTab === 'freight' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Freight Breakdown & Balances
                  </h4>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Payment Terms: To Pay
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Freight:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatINR(load.total_freight || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 font-bold">
                    <span className="text-slate-900 dark:text-white">Total Gross Freight:</span>
                    <span className="font-mono text-slate-900 dark:text-white text-sm">
                      {formatINR(load.total_freight || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Less: Advance Paid (Fuel Card / Cash):</span>
                    <span className="font-mono font-bold">- {formatINR(load.advance_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3 text-sm font-bold">
                    <span className="text-navy-950 dark:text-white">Balance Payable at Delivery:</span>
                    <span className="font-mono text-saffron-600 dark:text-saffron-400 text-base">
                      {formatINR(Math.max(0, (Number(load.total_freight) || 0) - (Number(load.advance_amount) || 0)))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STOPS & ROUTE */}
          {activeTab === 'stops' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Multi-Waypoint Waybill Stops
                </h4>
                <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  <div className="flex items-start gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-white dark:ring-slate-900 z-10">
                      1
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Pickup Origin: {load.origin_location?.name || 'Origin Hub'}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600">{load.status === 'in_transit' || load.status === 'dispatched' || load.status === 'delivered' ? 'Departed' : 'Scheduled'}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {load.origin_location?.address || 'Consignor Facility / Terminal Gate'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-white dark:ring-slate-900 z-10">
                      2
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Destination: {load.destination_location?.name || 'Destination Terminal'}
                        </span>
                        <span className="text-[10px] font-semibold text-amber-600">
                          {load.status === 'delivered' || load.status === 'completed' ? 'Delivered' : 'In Transit'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {load.destination_location?.address || 'Consignee Delivery Yard'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TIMELINE & AUDIT */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="text-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Current Status</p>
                      <p className="text-[11px] text-slate-400">Status updated to: <span className="uppercase font-bold">{load.status || 'Active'}</span></p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{formatDate(load.updated_at || load.created_at || new Date().toISOString())}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Load Registered & Intake</p>
                      <p className="text-[11px] text-slate-400">Consignment {load.load_number || load.id} booked into system</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{formatDate(load.created_at || new Date().toISOString())}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded PDF Drawer if requested */}
      {pdfPreviewType && (
        <PdfPreviewDrawer
          title={`${pdfPreviewType.toUpperCase()} Preview — ${load.load_number || load.id}`}
          documentType={pdfPreviewType as any}
          data={load}
          filename={`${load.load_number || load.id}.pdf`}
          isOpen={true}
          onClose={() => setPdfPreviewType(null)}
          onDownload={() => {
            if (pdfPreviewType === 'bilty') {
              downloadBiltyPdf({
                biltyNumber: load.bilty?.bilty_number || load.load_number,
                consignorName: load.consignor?.name,
                consigneeName: load.consignee?.name,
                from: load.origin_location?.name,
                to: load.destination_location?.name,
                truckNo: load.vehicle?.plate_number,
                driverName: load.driver?.name,
                freight: load.total_freight,
                advance: load.advance_amount,
                balance: (load.total_freight || 0) - (load.advance_amount || 0),
              });
            } else {
              downloadLrPdf({
                lrNumber: load.lr_number?.lr_number || load.load_number,
                consignorName: load.consignor?.name,
                consigneeName: load.consignee?.name,
                origin: load.origin_location?.name,
                destination: load.destination_location?.name,
                vehiclePlate: load.vehicle?.plate_number,
                driverName: load.driver?.name,
                freight: load.total_freight,
              });
            }
          }}
          onShareWhatsApp={() => {
            setPdfPreviewType(null);
            setShowWhatsApp(true);
          }}
        />
      )}

      {/* WhatsApp Share Drawer */}
      {showWhatsApp && (
        <WhatsAppShareButton
          documentType="load"
          documentNumber={String(load.load_number || load.id || '')}
          recipientName={load.consignor?.name || 'Customer'}
          recipientPhone={load.consignor?.phone || '+919876543210'}
          defaultMessage={`Dear ${load.consignor?.name || 'Customer'}, your consignment ${load.load_number || load.id} from ${load.origin_location?.name || 'Origin'} to ${load.destination_location?.name || 'Destination'} is currently IN TRANSIT. Assigned Truck: ${load.vehicle?.plate_number || 'Truck'}. Track live: https://track.techofay.com/shipment/${load.id}`}
        />
      )}
    </>
  );
};
