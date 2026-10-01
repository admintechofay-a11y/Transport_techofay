import React, { useState } from 'react';
import {
  FileText,
  Download,
  Plus,
  Share2,
  Printer,
  Search,
  MapPin,
  Truck,
  Building2,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { useLrNumbers, useCreateLrNumber, useUpdateLrStatus } from '@/hooks/use-lr-numbers';
import { useLoads } from '@/hooks/use-loads';
import { lrApi } from '@/lib/api/lr-numbers.api';
import { LrNumber } from '@/types/lr-number.types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WhatsAppShareButton } from '@/components/shared/WhatsAppShareButton';
import { PdfPreviewDrawer } from '@/components/shared/PdfPreviewDrawer';
import { formatINR, formatWeight } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { toast } from 'sonner';

export const LrNumbersPage: React.FC = () => {
  const { data: serverLrs, isLoading } = useLrNumbers();
  const createLrMutation = useCreateLrNumber();
  const updateLrStatusMutation = useUpdateLrStatus();
  const { data: serverLoads } = useLoads();

  const rawLrs = Array.isArray(serverLrs) ? serverLrs : (serverLrs as any)?.data;
  const lrs: LrNumber[] = Array.isArray(rawLrs) ? rawLrs : [];

  const rawLoads = Array.isArray(serverLoads) ? serverLoads : (serverLoads as any)?.data;
  const loads: any[] = Array.isArray(rawLoads) ? rawLoads : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [selectedLr, setSelectedLr] = useState<LrNumber | null>(null);
  const [previewPdfLr, setPreviewPdfLr] = useState<LrNumber | null>(null);
  const [whatsAppLr, setWhatsAppLr] = useState<LrNumber | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleIssueLr = async () => {
    const selectedL = loads.find((l: any) => (l.uuid || l.id || l.load_number) === selectedLoadId) || loads[0];

    try {
      await createLrMutation.mutateAsync({
        load_uuid: selectedL?.uuid || selectedL?.id,
        vehicle_uuid: selectedL?.vehicle_assigned_uuid || selectedL?.vehicle?.uuid,
        driver_uuid: selectedL?.driver_assigned_uuid || selectedL?.driver?.uuid,
        from_location: selectedL?.origin_location?.name || selectedL?.from_location || 'Origin Facility',
        to_location: selectedL?.destination_location?.name || selectedL?.to_location || 'Destination Terminal',
        remarks: 'Standard Transport LR',
      });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to issue LR on server');
    }
  };

  const filteredLrs = lrs.filter((lr) => {
    const matchesSearch =
      (lr.lr_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lr.consignor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lr.consignee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lr.vehicle_plate_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || (lr.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Lorry Receipts (LR / Consignment Note)
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-saffron-100 dark:bg-saffron-950/60 text-saffron-800 dark:text-saffron-300">
              {lrs.length} Active LRs
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Legal Indian road transport consignment contracts, freight liability terms, and e-way tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-saffron-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            Generate New LR
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by LR #, Consignor, Truck Plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'draft', 'generated', 'dispatched', 'delivered', 'invoiced'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'all' ? 'All LRs' : st}
              </button>
            ))}
          </div>
        </div>

        {/* LRs Table */}
        <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">LR Number</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Route Corridor</th>
                <th className="py-3 px-4">Consignor & Consignee</th>
                <th className="py-3 px-4">Truck & Driver</th>
                <th className="py-3 px-4 text-right">Weight (MT)</th>
                <th className="py-3 px-4 text-right">Freight (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLrs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No Lorry Receipts found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredLrs.map((lr) => (
                  <tr
                    key={lr.id}
                    onClick={() => setSelectedLr(lr)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    {/* LR Number */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-navy-900 dark:text-white group-hover:text-saffron-600 transition">
                        {lr.lr_number}
                      </span>
                      <span className="block text-[10px] text-slate-400 uppercase font-sans mt-0.5">
                        {lr.freight_terms ? lr.freight_terms.replace('_', ' ') : 'To Pay'}
                      </span>
                    </td>

                    {/* Issue Date */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {formatDate(lr.issued_date || new Date().toISOString())}
                    </td>

                    {/* Route Corridor */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{lr.from_city}</span>
                        <span className="text-slate-400">→</span>
                        <span>{lr.to_city}</span>
                      </div>
                    </td>

                    {/* Parties */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {lr.consignor_name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        To: {lr.consignee_name}
                      </div>
                    </td>

                    {/* Truck */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Truck className="w-3 h-3 text-saffron-500" />
                        {lr.vehicle_plate_number}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {lr.driver_name}
                      </div>
                    </td>

                    {/* Weight */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {lr.charged_weight} MT
                    </td>

                    {/* Freight */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatINR(lr.total_freight || 0)}
                      </span>
                      <span className="block text-[10px] text-saffron-600 dark:text-saffron-400 font-sans font-medium mt-0.5">
                        Bal: {formatINR(lr.balance_amount || 0)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={lr.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setWhatsAppLr(lr)}
                          className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-600 transition"
                          title="Share LR via WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const url = lrApi.getPdfUrl(lr.uuid || String(lr.id));
                            window.open(url, '_blank');
                          }}
                          className="p-1.5 rounded-md hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition"
                          title="Download Official Backend LR PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPreviewPdfLr(lr)}
                          className="p-1.5 rounded-md hover:bg-navy-50 dark:hover:bg-navy-950/60 text-slate-400 hover:text-navy-900 dark:hover:text-white transition"
                          title="Preview Legal LR PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedLr(lr)}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
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
      </div>

      {/* LR Detail Slide-over Drawer */}
      {selectedLr && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setSelectedLr(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-navy-900 dark:text-navy-100">
                      {selectedLr.lr_number}
                    </span>
                    <StatusBadge status={selectedLr.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Issued on {formatDate(selectedLr.issued_date || new Date().toISOString())}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWhatsAppLr(selectedLr)}
                  className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 transition"
                  title="WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewPdfLr(selectedLr)}
                  className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / PDF
                </button>
                <button
                  onClick={() => setSelectedLr(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Stepper Status Progression */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  LR Lifecycle Progression
                </span>
                <div className="flex items-center justify-between relative before:absolute before:left-3 before:right-3 before:top-3 before:h-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {['Draft', 'Generated', 'Dispatched', 'Delivered', 'Invoiced'].map((step, idx) => (
                    <div key={step} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                          idx <= 2
                            ? 'bg-saffron-500 text-white ring-4 ring-white dark:ring-slate-900'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corridor Box */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">From (Origin)</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedLr.from_city}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">To (Destination)</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedLr.to_city}</h4>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-1">
                    Consignor
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedLr.consignor_name}</div>
                  <p className="text-slate-500 mt-0.5">{selectedLr.consignor_address}</p>
                  <p className="font-mono text-slate-600 dark:text-slate-400 mt-2">
                    GSTIN: {selectedLr.consignor_gstin}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-bold uppercase text-blue-600 block mb-1">
                    Consignee
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedLr.consignee_name}</div>
                  <p className="text-slate-500 mt-0.5">{selectedLr.consignee_address}</p>
                  <p className="font-mono text-slate-600 dark:text-slate-400 mt-2">
                    GSTIN: {selectedLr.consignee_gstin}
                  </p>
                </div>
              </div>

              {/* Vehicle & Goods Details */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Vehicle Assigned:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedLr.vehicle_plate_number}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Driver on Duty:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedLr.driver_name} ({selectedLr.driver_phone})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Cargo Packaging:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedLr.total_packages} {selectedLr.package_type}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Charged Weight:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedLr.charged_weight} MT
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">E-Way Bill Number:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedLr.eway_bill_number}
                  </span>
                </div>
              </div>

              {/* Financial Terms */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-navy-50/50 dark:bg-navy-950/40 space-y-2">
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Total Freight:</span>
                  <span className="font-mono font-bold">{formatINR(selectedLr.total_freight || 0)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Advance Received:</span>
                  <span className="font-mono font-bold">- {formatINR(selectedLr.advance_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-navy-200 dark:border-navy-800 pt-2 text-slate-900 dark:text-white">
                  <span>Balance Payable ({selectedLr.freight_terms?.toUpperCase()}):</span>
                  <span className="font-mono text-saffron-600 dark:text-saffron-400">
                    {formatINR(selectedLr.balance_amount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fast LR Generator Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-saffron-500" />
                Generate Lorry Receipt (LR)
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Consignment / Load
                </label>
                <select
                  value={selectedLoadId}
                  onChange={(e) => setSelectedLoadId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono"
                >
                  <option value="">-- Select Active Consignment --</option>
                  {loads.map((l: any) => (
                    <option key={l.uuid || l.id || l.load_number} value={l.uuid || l.id || l.load_number}>
                      {l.load_number || l.internal_id || 'Consignment'} ({l.consignor?.name || 'Shipper'} → {l.consignee?.name || 'Receiver'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Generated LR Sequence
                </label>
                <input
                  type="text"
                  readOnly
                  value={`LR-${new Date().getFullYear()}-AUTO`}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 dark:bg-slate-800 p-2.5 font-mono font-bold text-navy-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Freight Terms
                </label>
                <select className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5">
                  <option value="to_pay">To Pay (Consignee will pay at destination)</option>
                  <option value="paid">Paid (Consignor prepaid)</option>
                  <option value="to_be_billed">To Be Billed (Monthly ledger credit)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueLr()}
                  className="px-5 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold transition-all shadow-md shadow-saffron-500/20 active:scale-95"
                >
                  Confirm & Issue LR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Drawer */}
      {previewPdfLr && (
        <PdfPreviewDrawer
          title={`Lorry Receipt — ${previewPdfLr.lr_number}`}
          documentType="lr"
          data={previewPdfLr}
          filename={`${previewPdfLr.lr_number}.pdf`}
          isOpen={true}
          onClose={() => setPreviewPdfLr(null)}
          onDownload={() => {
            const url = lrApi.getPdfUrl(previewPdfLr.uuid || String(previewPdfLr.id));
            window.open(url, '_blank');
          }}
          onShareWhatsApp={() => {
            const lr = previewPdfLr;
            setPreviewPdfLr(null);
            setWhatsAppLr(lr);
          }}
        />
      )}

      {/* WhatsApp Share Drawer */}
      {whatsAppLr && (
        <WhatsAppShareButton
          documentType="lr"
          documentNumber={whatsAppLr.lr_number}
          recipientName={whatsAppLr.consignor_name || 'Customer'}
          recipientPhone="+919876543210"
          defaultMessage={`Dear ${whatsAppLr.consignor_name}, your Lorry Receipt ${whatsAppLr.lr_number} for route ${whatsAppLr.from_city} to ${whatsAppLr.to_city} has been issued. Truck: ${whatsAppLr.vehicle_plate_number}. View document: https://track.techofay.com/lr/${whatsAppLr.lr_number}`}
        />
      )}
    </div>
  );
};
