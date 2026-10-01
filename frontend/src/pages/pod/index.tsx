import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  Search,
  Upload,
  Printer,
  Share2,
  ChevronRight,
  X,
  Truck,
  IndianRupee,
  FileCheck2,
  Loader2,
} from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useLoads } from '@/hooks/use-loads';
import { podApi, CreatePodPayload } from '@/lib/api/pod.api';
import { formatINR } from '@/lib/utils/currency';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { downloadPodCertificatePdf } from '@/lib/pdf-downloader';
import { toast } from 'sonner';
import { Load } from '@/types/load.types';

export const PodManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: loadsResponse, isLoading } = useLoads();
  const loads: Load[] = loadsResponse?.data || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified'>('all');
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);

  // Upload POD Modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTargetLoad, setUploadTargetLoad] = useState<Load | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 16));
  const [packagesCondition, setPackagesCondition] = useState('Good & Sound Condition (Seals Intact)');
  const [remarks, setRemarks] = useState('');
  const [stampPreview, setStampPreview] = useState<string | null>(null);

  const isPodVerified = (l: Load): boolean => {
    return l.pod_status === 'verified' || l.status === 'delivered' || Boolean(l.proofs && l.proofs.length > 0);
  };

  const createPodMutation = useMutation({
    mutationFn: (payload: CreatePodPayload) => podApi.create(payload),
    onSuccess: (newProof) => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success(`Proof of Delivery verified for ${uploadTargetLoad?.load_number || 'Shipment'}! Marked as delivered.`);
      setIsUploadOpen(false);

      if (selectedLoad && uploadTargetLoad && (selectedLoad.id === uploadTargetLoad.id || selectedLoad.uuid === uploadTargetLoad.uuid)) {
        setSelectedLoad({
          ...selectedLoad,
          status: 'delivered',
          pod_status: 'verified',
          pod_received_by: receiverName.trim(),
          pod_receiver_phone: receiverPhone.trim(),
          pod_delivery_date: new Date(deliveryDate).toISOString(),
          pod_remarks: remarks.trim(),
        });
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit Proof of Delivery.');
    },
  });

  const openUploadModal = (load: Load) => {
    setUploadTargetLoad(load);
    setReceiverName(load.pod_received_by || load.consignee?.name || '');
    setReceiverPhone(load.pod_receiver_phone || load.consignee?.phone || '+91 ');
    setDeliveryDate(new Date().toISOString().slice(0, 16));
    setPackagesCondition('Good & Sound Condition (Seals Intact)');
    setRemarks(load.pod_remarks || 'Material unloaded and physical inspection completed. Signed delivery copy verified.');
    setStampPreview(load.pod_url || null);
    setIsUploadOpen(true);
  };

  const handleSavePod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTargetLoad) return;
    if (!receiverName.trim()) {
      toast.error('Receiver supervisor / party name is required');
      return;
    }

    createPodMutation.mutate({
      order_uuid: String(uploadTargetLoad.uuid || uploadTargetLoad.id || ''),
      receiver_name: receiverName.trim(),
      receiver_phone: receiverPhone.trim(),
      delivery_date: new Date(deliveryDate).toISOString(),
      packages_condition: packagesCondition,
      remarks: remarks.trim(),
      file_url: stampPreview || undefined,
    });
  };

  const handleWhatsAppShare = (l: Load) => {
    const verified = isPodVerified(l);
    const text = verified
      ? `*CONSIGNMENT DELIVERY CONFIRMATION (POD VERIFIED)*\nShipment: *${l.load_number}*\nConsignee: ${l.consignee?.name || 'Customer'}\nDestination: ${l.destination_location?.name || 'Yard'}\nTruck: ${l.vehicle?.plate_number || 'Truck'}\nReceived By: *${l.pod_received_by || 'Supervisor'}*\nDelivery Date: ${l.pod_delivery_date ? formatDate(l.pod_delivery_date) : 'Today'}\nBalance Freight Due: ₹${((l.total_freight || 0) - (l.advance_amount || 0)).toLocaleString('en-IN')}\nStatus: DELIVERED & ACKNOWLEDGED`
      : `*DELIVERY STATUS INQUIRY (POD PENDING)*\nShipment: *${l.load_number}*\nConsignee: ${l.consignee?.name || 'Customer'}\nDestination: ${l.destination_location?.name || 'Yard'}\nTruck: ${l.vehicle?.plate_number || 'Truck'}\nDriver: ${l.driver?.name || 'Driver'}\nStatus: IN TRANSIT / AWAITING RECEIVER STAMP`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filter
  const filtered = loads.filter((l) => {
    const matchesSearch =
      (l.load_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.consignor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.consignee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.vehicle?.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.destination_location?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'pending') return !isPodVerified(l);
    if (activeTab === 'verified') return isPodVerified(l);
    return true;
  });

  const totalVerified = loads.filter((l) => isPodVerified(l)).length;
  const totalPending = loads.filter((l) => !isPodVerified(l)).length;
  const pendingFreightBalance = loads
    .filter((l) => !isPodVerified(l))
    .reduce((sum, l) => sum + Math.max(0, (l.total_freight || 0) - (l.advance_amount || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              Proof of Delivery (POD) Management
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#0F2D56] text-amber-300">
              {loads.length} Shipments
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Collect stamped delivery receipts, verify receiver signatures, and authorize final freight settlement
          </p>
        </div>

        {totalPending > 0 && (
          <button
            onClick={() => {
              const firstPending = loads.find((l) => !isPodVerified(l));
              if (firstPending) openUploadModal(firstPending);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            Upload Pending POD
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Consignments</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{loads.length}</span>
            <span className="text-[11px] text-slate-400">Total freight shipments</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Verified & Stamped</span>
            <span className="text-2xl font-bold text-emerald-600 font-mono mt-0.5 block">{totalVerified}</span>
            <span className="text-[11px] text-emerald-600/80">Authorized for final billing</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Pending Receiver POD</span>
            <span className="text-2xl font-bold text-amber-600 font-mono mt-0.5 block">{totalPending}</span>
            <span className="text-[11px] text-amber-600/80">In transit / unloading</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Locked Awaiting POD</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{formatINR(pendingFreightBalance)}</span>
            <span className="text-[11px] text-slate-400">Balance dues payable</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search & Tabs */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Load #, Consignee, Vehicle, City..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-200/70 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Shipments ({loads.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pending POD ({totalPending})
            </button>
            <button
              onClick={() => setActiveTab('verified')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                activeTab === 'verified'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Verified & Cleared ({totalVerified})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Consignment #</th>
                <th className="py-3 px-4">Consignee (Delivery Party)</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4">Destination Yard</th>
                <th className="py-3 px-4 text-center">POD Verification</th>
                <th className="py-3 px-4">Receiver Info</th>
                <th className="py-3 px-4 text-right">Freight Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <p className="text-xs">Loading consignments from server...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No Consignments in this View</p>
                    <p className="text-xs text-slate-400 mt-1">Book consignments to track live Proof of Delivery receipts.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const verified = isPodVerified(l);
                  const balance = Math.max(0, (l.total_freight || 0) - (l.advance_amount || 0));

                  return (
                    <tr
                      key={l.id || l.uuid}
                      onClick={() => setSelectedLoad(l)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                        {l.load_number}
                        <span className="text-[10px] text-slate-400 block font-sans font-normal">
                          {l.created_at ? formatDate(l.created_at) : 'Today'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {l.consignee?.name || 'Consignee'}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Shipper: {l.consignor?.name || 'Consignor'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {l.vehicle?.plate_number || 'Unassigned'}
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans">{l.driver?.name || 'Driver'}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <span className="font-medium block">{l.destination_location?.name || 'Destination'}</span>
                        <span className="text-[10px] text-slate-400">From: {l.origin_location?.name || 'Origin'}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            POD Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending POD
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {verified ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {l.pod_received_by || 'Receiver'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {l.pod_delivery_date ? formatDate(l.pod_delivery_date) : 'Delivered'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Awaiting Stamp</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className={`font-bold ${balance > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                          {formatINR(balance)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Total: {formatINR(l.total_freight || 0)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!verified ? (
                            <button
                              onClick={() => openUploadModal(l)}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                              title="Upload Signed POD"
                            >
                              <Upload className="w-3 h-3 stroke-[2.5]" />
                              Verify POD
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const proofId = l.proofs?.[0]?.uuid || l.proofs?.[0]?.id;
                                if (proofId) {
                                  window.open(podApi.getPdfUrl(proofId), '_blank');
                                } else {
                                  downloadPodCertificatePdf({
                                    loadNumber: l.load_number || 'Consignment',
                                    lrNumber: l.load_number,
                                    consignorName: l.consignor?.name || 'Consignor',
                                    consigneeName: l.consignee?.name || 'Consignee',
                                    destination: l.destination_location?.name || 'Yard',
                                    vehiclePlate: l.vehicle?.plate_number || 'Truck',
                                    driverName: l.driver?.name || 'Driver',
                                    receiverName: l.pod_received_by || 'Receiver',
                                    receiverPhone: l.pod_receiver_phone || '+91',
                                    deliveryDate: l.pod_delivery_date ? formatDate(l.pod_delivery_date) : undefined,
                                    packagesReceived: Number((l as any).quantity) || 1,
                                    remarks: l.pod_remarks || 'Delivered in sound condition.',
                                  });
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                              title="Download POD Certificate PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleWhatsAppShare(l)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedLoad(l)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                            title="View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer: Detailed Inspection */}
      {selectedLoad && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    {selectedLoad.load_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isPodVerified(selectedLoad)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isPodVerified(selectedLoad) ? 'POD Verified' : 'Pending POD'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Route: {selectedLoad.origin_location?.name || 'Origin'} &rarr; {selectedLoad.destination_location?.name || 'Destination'}
                </p>
              </div>
              <button
                onClick={() => setSelectedLoad(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider block">Consignment Parties</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consignor (Sender):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedLoad.consignor?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consignee (Receiver):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedLoad.consignee?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Truck Plate:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedLoad.vehicle?.plate_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedLoad.driver?.name || '-'}</span>
                </div>
              </div>

              {isPodVerified(selectedLoad) ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Receiver Delivery Certificate
                  </span>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-400">Received By:</span>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">{selectedLoad.pod_received_by || '-'}</span>
                  </div>
                  {selectedLoad.pod_receiver_phone && (
                    <div className="flex justify-between">
                      <span className="text-emerald-700 dark:text-emerald-400">Phone:</span>
                      <span className="font-mono text-emerald-900 dark:text-emerald-200">{selectedLoad.pod_receiver_phone}</span>
                    </div>
                  )}
                  {selectedLoad.pod_delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-emerald-700 dark:text-emerald-400">Delivery Date:</span>
                      <span className="text-emerald-900 dark:text-emerald-200">{formatDateTime(selectedLoad.pod_delivery_date)}</span>
                    </div>
                  )}
                  {selectedLoad.pod_remarks && (
                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800">
                      <span className="text-slate-500 block mb-0.5">Receiver Remarks:</span>
                      <p className="italic text-slate-700 dark:text-slate-300">"{selectedLoad.pod_remarks}"</p>
                    </div>
                  )}
                  {selectedLoad.pod_url && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Stamped Receipt Copy:</span>
                      <div className="p-2 rounded-lg bg-white border border-emerald-200 flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-slate-800 font-mono text-[11px]">official_stamped_pod.pdf</span>
                        <span className="ml-auto text-emerald-600 font-bold text-[10px]">VERIFIED</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-2">
                  <Clock className="w-6 h-6 text-amber-600 mx-auto" />
                  <p className="font-bold text-amber-900 dark:text-amber-200">Proof of Delivery Pending</p>
                  <p className="text-amber-700 dark:text-amber-300 text-[11px]">
                    Material is in transit. Upload signed unloading sheet to unlock final settlement.
                  </p>
                  <button
                    onClick={() => openUploadModal(selectedLoad)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition mt-2 shadow-xs"
                  >
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    Upload & Verify POD Now
                  </button>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider block">Financial Clearance Status</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Freight:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatINR(selectedLoad.total_freight || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Advance Received:</span>
                  <span className="font-bold text-emerald-600">{formatINR(selectedLoad.advance_amount || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Balance Due:</span>
                  <span className="font-mono font-bold text-amber-600">
                    {formatINR(Math.max(0, (selectedLoad.total_freight || 0) - (selectedLoad.advance_amount || 0)))}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {isPodVerified(selectedLoad) && (
                <button
                  onClick={() => {
                    const proofId = selectedLoad.proofs?.[0]?.uuid || selectedLoad.proofs?.[0]?.id;
                    if (proofId) {
                      window.open(podApi.getPdfUrl(proofId), '_blank');
                    } else {
                      downloadPodCertificatePdf({
                        loadNumber: selectedLoad.load_number || 'Consignment',
                        lrNumber: selectedLoad.load_number,
                        consignorName: selectedLoad.consignor?.name || 'Consignor',
                        consigneeName: selectedLoad.consignee?.name || 'Consignee',
                        destination: selectedLoad.destination_location?.name || 'Yard',
                        vehiclePlate: selectedLoad.vehicle?.plate_number || 'Truck',
                        driverName: selectedLoad.driver?.name || 'Driver',
                        receiverName: selectedLoad.pod_received_by || 'Receiver',
                        receiverPhone: selectedLoad.pod_receiver_phone || '+91',
                        deliveryDate: selectedLoad.pod_delivery_date ? formatDate(selectedLoad.pod_delivery_date) : undefined,
                        packagesReceived: Number((selectedLoad as any).quantity) || 1,
                        remarks: selectedLoad.pod_remarks || 'Delivered in sound condition.',
                      });
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  Print Official POD Certificate
                </button>
              )}

              <button
                onClick={() => handleWhatsAppShare(selectedLoad)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-4 h-4" />
                Share Delivery Update on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload POD Modal */}
      {isUploadOpen && uploadTargetLoad && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <FileCheck2 className="w-4 h-4 text-amber-500" />
                Upload & Verify Proof of Delivery (POD)
              </h3>
              <button onClick={() => setIsUploadOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSavePod} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-slate-800 dark:text-slate-200">
                <span className="font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                  Shipment: {uploadTargetLoad.load_number}
                </span>
                <span>
                  Destination: {uploadTargetLoad.destination_location?.name || 'Yard'} &bull; Truck: {uploadTargetLoad.vehicle?.plate_number || 'TBD'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Receiver / Supervisor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel (Warehouse In-Charge)"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Receiver Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98250 12345"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Delivery Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo Inspection Condition
                  </label>
                  <select
                    value={packagesCondition}
                    onChange={(e) => setPackagesCondition(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="Good & Sound Condition (Seals Intact)">Good & Sound Condition (Seals Intact)</option>
                    <option value="Minor Packaging Dent / Material OK">Minor Packaging Dent / Material OK</option>
                    <option value="Partial Shortage Noted on Challan">Partial Shortage Noted on Challan</option>
                    <option value="Damaged - Claim Registered">Damaged - Claim Registered</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Receiver Stamp / Signature Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Physical cargo counted, weighment slip verified and receiver stamp applied on LR copy."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stamped Physical Proof / Receipt
                  </label>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setStampPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      {stampPreview ? 'Document Selected / Attached' : 'Attach Stamped Physical LR / Delivery Challan'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Camera capture, scanned PNG/JPG or PDF copy
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPodMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-1.5"
                >
                  {createPodMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm & Verify POD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
