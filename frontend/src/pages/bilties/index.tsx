import React, { useState } from 'react';
import {
  Printer,
  Download,
  Plus,
  Share2,
  FileText,
  Search,
  MapPin,
  Truck,
  IndianRupee,
  Building2,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useBilties, useCreateBilty } from '@/hooks/use-bilties';
import { biltyApi } from '@/lib/api/bilties.api';
import { Bilty } from '@/types/bilty.types';
import { useTransportStore } from '@/stores/transport-data.store';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WhatsAppShareButton } from '@/components/shared/WhatsAppShareButton';
import { PdfPreviewDrawer } from '@/components/shared/PdfPreviewDrawer';
import { formatINR } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { toast } from 'sonner';

export const BiltiesPage: React.FC = () => {
  const storeLoads = useTransportStore((s) => s.loads);

  const { data: serverBilties, isLoading } = useBilties();
  const createBiltyMutation = useCreateBilty();
  const rawList = Array.isArray(serverBilties) ? serverBilties : (serverBilties as any)?.data;
  const bilties: Bilty[] = Array.isArray(rawList) ? rawList : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [selectedBilty, setSelectedBilty] = useState<Bilty | null>(null);
  const [previewPdfBilty, setPreviewPdfBilty] = useState<Bilty | null>(null);
  const [whatsAppBilty, setWhatsAppBilty] = useState<Bilty | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCopyTab, setActiveCopyTab] = useState<'consignee' | 'consignor' | 'driver' | 'transporter'>('consignee');

  const handleIssueBilty = async () => {
    const selectedL = storeLoads.find((l) => l.id === selectedLoadId || l.load_number === selectedLoadId) || storeLoads[0];
    if (!selectedL) {
      toast.error('Please create or select an active consignment load first');
      return;
    }
    const totalFreight = Number(selectedL.total_freight) || 0;
    const advanceAmount = Number(selectedL.advance_amount) || 0;

    try {
      await createBiltyMutation.mutateAsync({
        load_uuid: selectedL.uuid || (selectedL.id ? String(selectedL.id) : undefined),
        from_location: selectedL.origin_location?.name || (selectedL as any).origin_city || 'Origin',
        to_location: selectedL.destination_location?.name || (selectedL as any).destination_city || 'Destination',
        freight_amount: totalFreight,
        advance_amount: advanceAmount,
        total_weight: Number((selectedL as any).weight_mt || (selectedL.vehicle as any)?.capacity_tonnage || 0),
        remarks: (selectedL as any).cargo_description || (selectedL as any).goods_description || 'General Goods',
      });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to issue Bilty on server');
    }
  };

  const filteredBilties = bilties.filter((b) => {
    return (
      (b.bilty_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.lr_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.consignor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.consignee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.vehicle_plate_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Bilty Management (Consignment Note)
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-100 dark:bg-navy-950/60 text-navy-800 dark:text-navy-300">
              {bilties.length} Issued
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            4-Copy official Indian transport bilties with GST SAC 9965 and Reverse Charge (RCM) compliance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-saffron-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            Create Bilty
          </button>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Bilty #, LR #, Consignor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
            />
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            SAC: <strong className="font-mono text-slate-800 dark:text-slate-200">9965 (Goods Transport)</strong>
          </div>
        </div>

        <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Bilty Ref #</th>
                <th className="py-3 px-4">LR Reference</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Route (Origin → Destination)</th>
                <th className="py-3 px-4">Parties</th>
                <th className="py-3 px-4 text-right">Total Freight (₹)</th>
                <th className="py-3 px-4 text-right">Advance (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBilties.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No Bilties found.
                  </td>
                </tr>
              ) : (
                filteredBilties.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBilty(b)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    {/* Bilty Ref */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-navy-950 dark:text-white group-hover:text-saffron-600 transition">
                        {b.bilty_number}
                      </span>
                      <span className="block text-[10px] text-slate-400 uppercase font-sans mt-0.5">
                        RCM: {b.gst_rcm ? 'Applicable' : 'No'}
                      </span>
                    </td>

                    {/* LR Ref */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {typeof b.lr_number === 'object' ? b.lr_number?.lr_number : b.lr_number}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {formatDate(b.bilty_date || new Date().toISOString())}
                    </td>

                    {/* Corridor */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{b.from_city}</span>
                        <span className="text-slate-400">→</span>
                        <span>{b.to_city}</span>
                      </div>
                    </td>

                    {/* Parties */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                        {b.consignor_name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        To: {b.consignee_name}
                      </div>
                    </td>

                    {/* Total Freight */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(b.total_freight || 0)}
                    </td>

                    {/* Advance */}
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatINR(b.advance_amount || 0)}
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 px-4 text-right font-mono text-saffron-600 dark:text-saffron-400 font-bold">
                      {formatINR(b.balance_amount || 0)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={b.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setWhatsAppBilty(b)}
                          className="p-1.5 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition"
                          title="Share Bilty on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            window.open(biltyApi.getPdfUrl(b.uuid || String(b.id)), '_blank');
                          }}
                          className="p-1.5 rounded-md hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition"
                          title="Download Bilty PDF Directly"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPreviewPdfBilty(b)}
                          className="p-1.5 rounded-md hover:bg-navy-50 text-slate-400 hover:text-navy-900 transition"
                          title="Print 4-Copy Bilty PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedBilty(b)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
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

      {/* Slide-over Bilty Drawer */}
      {selectedBilty && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setSelectedBilty(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-navy-900 dark:text-navy-100">
                    {selectedBilty.bilty_number}
                  </span>
                  <StatusBadge status={selectedBilty.status} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consignment Note for LR {typeof selectedBilty.lr_number === 'object' ? selectedBilty.lr_number?.lr_number : selectedBilty.lr_number}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    downloadBiltyPdf({
                      biltyNumber: selectedBilty.bilty_number,
                      consignorName: selectedBilty.consignor_name,
                      consigneeName: selectedBilty.consignee_name,
                      from: selectedBilty.from_city,
                      to: selectedBilty.to_city,
                      truckNo: selectedBilty.vehicle_plate_number,
                      driverName: selectedBilty.driver_name,
                      weight: selectedBilty.weight_mt,
                      packages: selectedBilty.total_packages,
                      freight: selectedBilty.total_freight,
                      advance: selectedBilty.advance_amount,
                      balance: selectedBilty.balance_amount,
                      copyType: activeCopyTab === 'consignor' ? 'Consignor' : activeCopyTab === 'driver' ? 'Driver' : activeCopyTab === 'transporter' ? 'Transporter' : 'Consignee',
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
                <button
                  onClick={() => setPreviewPdfBilty(selectedBilty)}
                  className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print A4 Copy
                </button>
                <button
                  onClick={() => setSelectedBilty(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 4-Copy Tab Switcher */}
            <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex space-x-2">
              {[
                { id: 'consignee', label: 'Consignee Copy (Pink)' },
                { id: 'consignor', label: 'Consignor Copy (White)' },
                { id: 'driver', label: 'Driver Copy (Yellow)' },
                { id: 'transporter', label: 'Transporter Copy (Blue)' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCopyTab(c.id as any)}
                  className={`px-3 py-1 rounded text-[11px] font-semibold transition ${
                    activeCopyTab === c.id
                      ? 'bg-white dark:bg-slate-900 text-navy-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Header Legal Disclaimer */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-300">
                Goods received in apparent good order and condition for delivery at the destination specified, subject to the conditions of carriage on the reverse hereof. GST payable under Reverse Charge Mechanism (RCM) by recipient.
              </div>

              {/* Corridor & Truck */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Truck Assigned</span>
                  <div className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {selectedBilty.vehicle_plate_number}
                  </div>
                  <p className="text-slate-500 mt-0.5">Driver: {selectedBilty.driver_name}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Corridor</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {selectedBilty.from_city} → {selectedBilty.to_city}
                  </div>
                  <p className="text-slate-500 mt-0.5">SAC Code: {selectedBilty.sac_code || '9965'}</p>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-bold uppercase text-emerald-600">Consignor (Sender)</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">{selectedBilty.consignor_name}</div>
                  <p className="text-slate-500 mt-0.5">{selectedBilty.consignor_address}</p>
                  <p className="font-mono text-slate-600 dark:text-slate-400 mt-1">GSTIN: {selectedBilty.consignor_gstin}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-bold uppercase text-blue-600">Consignee (Receiver)</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">{selectedBilty.consignee_name}</div>
                  <p className="text-slate-500 mt-0.5">{selectedBilty.consignee_address}</p>
                  <p className="font-mono text-slate-600 dark:text-slate-400 mt-1">GSTIN: {selectedBilty.consignee_gstin}</p>
                </div>
              </div>

              {/* Freight Itemized Breakdown */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Freight Charges Itemization
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Freight ({selectedBilty.weight_mt} MT):</span>
                  <span className="font-mono font-semibold">{formatINR(selectedBilty.base_freight || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hamali / Loading Charges:</span>
                  <span className="font-mono font-semibold">{formatINR(selectedBilty.loading_charges || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Toll & FASTag Charges:</span>
                  <span className="font-mono font-semibold">{formatINR(selectedBilty.toll_charges || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 font-bold text-slate-900 dark:text-white">
                  <span>Total Gross Freight:</span>
                  <span className="font-mono text-sm">{formatINR(selectedBilty.total_freight || 0)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Less: Advance Paid:</span>
                  <span className="font-mono font-bold">- {formatINR(selectedBilty.advance_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-900 dark:text-white">
                  <span>Balance Payable at Delivery:</span>
                  <span className="font-mono text-saffron-600 dark:text-saffron-400">
                    {formatINR(selectedBilty.balance_amount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fast Create Bilty Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Printer className="w-4 h-4 text-saffron-500" />
                Issue Transport Bilty
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
                  {storeLoads.map((l) => (
                    <option key={l.id || l.load_number} value={l.id || l.load_number}>
                      {l.load_number} ({l.consignor?.name || 'Shipper'} → {l.consignee?.name || 'Receiver'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bilty Sequence
                </label>
                <input
                  type="text"
                  readOnly
                  value={`BL-${new Date().getFullYear()}-AUTO`}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 dark:bg-slate-800 p-2.5 font-mono font-bold text-navy-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="rcmCheck" defaultChecked className="rounded border-slate-300" />
                <label htmlFor="rcmCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  GST Reverse Charge Mechanism (RCM) Applicable under SAC 9965
                </label>
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
                  onClick={() => handleIssueBilty()}
                  className="px-5 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold transition-all shadow-md shadow-saffron-500/20 active:scale-95"
                >
                  Confirm & Issue Bilty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Drawer */}
      {previewPdfBilty && (
        <PdfPreviewDrawer
          title={`Consignment Bilty — ${previewPdfBilty.bilty_number}`}
          documentType="bilty"
          data={previewPdfBilty}
          filename={`${previewPdfBilty.bilty_number}.pdf`}
          isOpen={true}
          onClose={() => setPreviewPdfBilty(null)}
          onDownload={() => {
            window.open(biltyApi.getPdfUrl(previewPdfBilty.uuid || String(previewPdfBilty.id)), '_blank');
          }}
          onShareWhatsApp={() => {
            const b = previewPdfBilty;
            setPreviewPdfBilty(null);
            setWhatsAppBilty(b);
          }}
        />
      )}

      {/* WhatsApp Share Drawer */}
      {whatsAppBilty && (
        <WhatsAppShareButton
          documentType="bilty"
          documentNumber={whatsAppBilty.bilty_number}
          recipientName={whatsAppBilty.consignor_name || 'Customer'}
          recipientPhone="+919876543210"
          defaultMessage={`Dear ${whatsAppBilty.consignor_name}, your official Bilty ${whatsAppBilty.bilty_number} for LR ${whatsAppBilty.lr_number} has been generated. Total Freight: ${formatINR(whatsAppBilty.total_freight || 0)}. View and download copy: https://track.techofay.com/bilty/${whatsAppBilty.bilty_number}`}
        />
      )}
    </div>
  );
};
