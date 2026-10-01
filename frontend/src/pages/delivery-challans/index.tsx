import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Share2,
  Printer,
  ChevronRight,
  Package,
  Truck,
  Building2,
  CheckCircle2,
  X,
  Clock,
  Check,
  AlertCircle,
  Eye,
  Trash2,
} from 'lucide-react';
import { DeliveryChallan } from '@/types/delivery-challan.types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils/date';
import { downloadDeliveryChallanPdf } from '@/lib/pdf-downloader';
import {
  useDeliveryChallans,
  useCreateDeliveryChallan,
  useUpdateDeliveryChallan,
  useDeleteDeliveryChallan,
} from '@/hooks/use-delivery-challans';
import { challanApi } from '@/lib/api/delivery-challans.api';
import { useLoads } from '@/hooks/use-loads';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { toast } from 'sonner';

export const DeliveryChallansPage: React.FC = () => {
  const { data: challansResponse, isLoading } = useDeliveryChallans();
  const createChallanMutation = useCreateDeliveryChallan();
  const updateChallanMutation = useUpdateDeliveryChallan();
  const deleteChallanMutation = useDeleteDeliveryChallan();

  const { data: serverLoads } = useLoads();
  const { data: serverVehicles } = useVehicles();
  const { data: serverDrivers } = useDrivers();

  const rawChallans = Array.isArray(challansResponse) ? challansResponse : (challansResponse as any)?.data || [];
  const storeLoads = Array.isArray(serverLoads) ? serverLoads : (serverLoads as any)?.data || [];
  const storeVehicles = Array.isArray(serverVehicles) ? serverVehicles : (serverVehicles as any)?.data || [];
  const storeDrivers = Array.isArray(serverDrivers) ? serverDrivers : (serverDrivers as any)?.data || [];

  const storeChallans: DeliveryChallan[] = rawChallans;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [selectedChallan, setSelectedChallan] = useState<DeliveryChallan | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isMarkDeliverModalOpen, setIsMarkDeliverModalOpen] = useState(false);
  const [challanToDeliver, setChallanToDeliver] = useState<DeliveryChallan | null>(null);
  const [receiverNameInput, setReceiverNameInput] = useState('');

  // Generate modal form state
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [challanNumber, setChallanNumber] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [consigneePhone, setConsigneePhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [totalWeight, setTotalWeight] = useState('25');
  const [totalQuantity, setTotalQuantity] = useState('1');
  const [remarks, setRemarks] = useState('');

  // Handle load selection in modal
  const handleLoadSelect = (loadId: string) => {
    setSelectedLoadId(loadId);
    const foundLoad = storeLoads.find((l) => l.id === loadId || l.load_number === loadId);
    if (foundLoad) {
      setConsigneeName(foundLoad.consignee?.name || '');
      setConsigneeAddress(foundLoad.destination_location?.name || foundLoad.consignee?.address || '');
      setConsigneePhone(foundLoad.consignee?.phone || '');
      setVehiclePlate(foundLoad.vehicle?.plate_number || '');
      setDriverName(foundLoad.driver?.name || '');
      setTotalWeight(String((foundLoad as any).weight_mt || '25'));
      setTotalQuantity(String((foundLoad as any).quantity || '1'));
    }
  };

  const openGenerateModal = () => {
    const nextSeq = Math.floor(1000 + Math.random() * 9000);
    setChallanNumber(`DC-${new Date().getFullYear()}-${nextSeq}`);
    if (storeLoads.length > 0) {
      handleLoadSelect(String(storeLoads[0].id || storeLoads[0].load_number || ''));
    } else {
      setSelectedLoadId('');
      setConsigneeName('');
      setConsigneeAddress('');
      setConsigneePhone('');
      setVehiclePlate(storeVehicles[0]?.plate_number || '');
      setDriverName(storeDrivers[0]?.name || '');
      setTotalWeight('25');
      setTotalQuantity('1');
    }
    setRemarks('Unloading gate supervisor to inspect cargo seal and sign.');
    setIsGenerateOpen(true);
  };

  const handleSaveChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consigneeName.trim()) {
      toast.error('Consignee name is required');
      return;
    }

    const selectedLoad = storeLoads.find((l: any) => l.id === selectedLoadId || l.load_number === selectedLoadId || l.uuid === selectedLoadId);

    const payload: Partial<DeliveryChallan> = {
      challan_number: challanNumber.trim(),
      challan_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      load_uuid: selectedLoad?.uuid || selectedLoadId || undefined,
      consignee: {
        name: consigneeName.trim(),
        phone: consigneePhone.trim(),
        delivery_address: consigneeAddress.trim() || 'Consignee Yard',
      },
      vehicle: {
        plate_number: vehiclePlate.trim() || 'TBD',
      },
      driver: {
        name: driverName.trim() || 'Assigned Driver',
      },
      total_weight: Number(totalWeight) || 0,
      total_quantity: Number(totalQuantity) || 1,
      remarks: remarks.trim(),
    };

    try {
      await createChallanMutation.mutateAsync(payload);
      setIsGenerateOpen(false);
    } catch (err: any) {
      // handled by mutation onError
    }
  };

  const handleMarkDelivered = async () => {
    if (!challanToDeliver) return;
    if (!receiverNameInput.trim()) {
      toast.error('Please enter receiver/supervisor name');
      return;
    }

    try {
      const updated = await updateChallanMutation.mutateAsync({
        id: challanToDeliver.uuid || String(challanToDeliver.id),
        data: {
          status: 'delivered',
          received_by: receiverNameInput.trim(),
        },
      });

      setIsMarkDeliverModalOpen(false);
      if (selectedChallan?.uuid === challanToDeliver.uuid) {
        setSelectedChallan(updated);
      }
      setChallanToDeliver(null);
      setReceiverNameInput('');
    } catch (err: any) {
      // handled by mutation onError
    }
  };

  const handleWhatsAppShare = (c: DeliveryChallan) => {
    const text = `*DELIVERY CHALLAN NOTIFICATION*\nChallan No: *${c.challan_number}*\nShipment: ${c.order?.load_number || 'Consignment'}\nReceiver: ${c.consignee?.name || 'Customer'}\nDestination: ${c.consignee?.delivery_address || 'Unloading Yard'}\nVehicle: ${c.vehicle?.plate_number || 'Truck'}\nWeight: ${c.total_weight} MT\nPackages: ${c.total_quantity}\nStatus: ${(c.status || 'PENDING').toUpperCase()}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filtering
  const filtered = storeChallans.filter((c) => {
    const matchesSearch =
      c.challan_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.consignee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.vehicle?.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.order?.load_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'pending') return c.status === 'pending';
    if (statusFilter === 'delivered') return c.status === 'delivered';
    return true;
  });

  const totalDelivered = storeChallans.filter((c) => c.status === 'delivered').length;
  const totalPending = storeChallans.filter((c) => c.status === 'pending').length;
  const totalWeightMt = storeChallans.reduce((sum, c) => sum + (Number(c.total_weight) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Delivery Challans (DC)
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#0F2D56] text-amber-300">
              {storeChallans.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Material transit handover vouchers, receiver acknowledgment stamps, and unloading delivery proof
          </p>
        </div>

        <button
          onClick={openGenerateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Issue Delivery Challan
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Challans</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{storeChallans.length}</span>
            <span className="text-[11px] text-slate-400">All registered transit notes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Delivered & Stamped</span>
            <span className="text-2xl font-bold text-emerald-600 font-mono mt-0.5 block">{totalDelivered}</span>
            <span className="text-[11px] text-emerald-600/80">Acknowledged by consignee</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">In Transit / Pending</span>
            <span className="text-2xl font-bold text-amber-600 font-mono mt-0.5 block">{totalPending}</span>
            <span className="text-[11px] text-amber-600/80">Awaiting receiver receipt</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Freight Weight</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{totalWeightMt.toFixed(1)} MT</span>
            <span className="text-[11px] text-slate-400">Tonnage dispatched</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search & Tabs Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Challan #, Consignee, Truck..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-200/70 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({storeChallans.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pending ({totalPending})
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                statusFilter === 'delivered'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Delivered ({totalDelivered})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Challan Ref #</th>
                <th className="py-3 px-4">Load / Consignment</th>
                <th className="py-3 px-4">Consignee (Delivery Party)</th>
                <th className="py-3 px-4">Assigned Truck</th>
                <th className="py-3 px-4 text-right">Packages / Weight</th>
                <th className="py-3 px-4 text-center">Delivery Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No Delivery Challans Found</p>
                    <p className="text-slate-400 mt-1">Book consignments or click "Issue Delivery Challan" to generate official dispatch notes.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.uuid}
                    onClick={() => setSelectedChallan(c)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                      {c.challan_number}
                      <span className="text-[10px] text-slate-400 block font-sans font-normal">
                        {c.challan_date ? formatDate(c.challan_date) : 'Today'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      {c.order?.load_number || '-'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.consignee?.name || 'Consignee'}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                        {c.consignee?.delivery_address || 'Unloading Yard'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.vehicle?.plate_number || 'Unassigned'}
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">{c.driver?.name || 'Driver'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {c.total_weight} MT
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {c.total_quantity} Packages
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={c.status} />
                      {c.received_by && (
                        <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                          Rec: {c.received_by}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.status === 'pending' && (
                          <button
                            onClick={() => {
                              setChallanToDeliver(c);
                              setReceiverNameInput('');
                              setIsMarkDeliverModalOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Mark Consignment Delivered"
                          >
                            <Check className="w-3 h-3" />
                            Deliver
                          </button>
                        )}

                        <button
                          onClick={() => handleWhatsAppShare(c)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            downloadDeliveryChallanPdf({
                              challanNumber: c.challan_number,
                              orderNumber: c.order?.load_number || c.challan_number,
                              date: formatDate(c.challan_date || new Date().toISOString()),
                              consignorName: 'TECHOFAY GLOBAL VENTURES',
                              consigneeName: c.consignee?.name || 'Consignee',
                              consigneeAddress: c.consignee?.delivery_address || 'Delivery Address',
                              vehiclePlate: c.vehicle?.plate_number || 'Unassigned',
                              driverName: c.driver?.name || 'Unassigned Driver',
                              totalWeight: c.total_weight,
                              totalQuantity: c.total_quantity,
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                          title="Download Delivery Challan PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedChallan(c)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                          title="View Details"
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

      {/* Slide-out Challan Detail Drawer */}
      {selectedChallan && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    {selectedChallan.challan_number}
                  </span>
                  <StatusBadge status={selectedChallan.status} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Issued: {formatDate(selectedChallan.challan_date || selectedChallan.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedChallan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider block">Consignment Information</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Load Ref #:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedChallan.order?.load_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consignee:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedChallan.consignee?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unloading Address:</span>
                  <span className="text-slate-700 dark:text-slate-300 text-right max-w-[200px]">{selectedChallan.consignee?.delivery_address || '-'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider block">Truck & Driver Manifest</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Vehicle:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedChallan.vehicle?.plate_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commercial Driver:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedChallan.driver?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Weight:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedChallan.total_weight} MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Packages:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedChallan.total_quantity} Pkgs</span>
                </div>
              </div>

              {selectedChallan.status === 'delivered' ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Delivery Receipt Acknowledgment
                  </span>
                  <p className="text-emerald-900 dark:text-emerald-200">
                    Received By: <span className="font-bold">{selectedChallan.received_by || 'Receiver Supervisor'}</span>
                  </p>
                  {selectedChallan.delivered_at && (
                    <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                      Delivered on: {formatDate(selectedChallan.delivered_at)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <span className="font-bold text-[11px] text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Clock className="w-4 h-4 text-amber-600" /> In-Transit Cargo
                  </span>
                  <button
                    onClick={() => {
                      setChallanToDeliver(selectedChallan);
                      setReceiverNameInput('');
                      setIsMarkDeliverModalOpen(true);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    Record Consignment Delivery
                  </button>
                </div>
              )}

              {selectedChallan.remarks && (
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Gate & Handling Instructions:</span>
                  <p className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 italic text-[11px]">
                    "{selectedChallan.remarks}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() =>
                  downloadDeliveryChallanPdf({
                    challanNumber: selectedChallan.challan_number,
                    orderNumber: selectedChallan.order?.load_number || selectedChallan.challan_number,
                    date: formatDate(selectedChallan.challan_date || new Date().toISOString()),
                    consignorName: 'TECHOFAY GLOBAL VENTURES',
                    consigneeName: selectedChallan.consignee?.name || 'Consignee',
                    consigneeAddress: selectedChallan.consignee?.delivery_address || 'Delivery Address',
                    vehiclePlate: selectedChallan.vehicle?.plate_number || 'Unassigned',
                    driverName: selectedChallan.driver?.name || 'Unassigned Driver',
                    totalWeight: selectedChallan.total_weight,
                    totalQuantity: selectedChallan.total_quantity,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                Print Official Challan PDF
              </button>

              <button
                onClick={() => handleWhatsAppShare(selectedChallan)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-4 h-4" />
                Share Challan on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Delivered Modal */}
      {isMarkDeliverModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Acknowledge Material Delivery
              </h3>
              <button onClick={() => setIsMarkDeliverModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Record receiver details for Delivery Challan <span className="font-mono font-bold text-slate-900 dark:text-white">{challanToDeliver?.challan_number}</span>:
              </p>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receiver / Supervisor Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patel (Warehouse In-Charge)"
                  value={receiverNameInput}
                  onChange={(e) => setReceiverNameInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMarkDeliverModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkDelivered}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirm Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Challan Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-amber-500" />
                Issue New Delivery Challan
              </h3>
              <button onClick={() => setIsGenerateOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveChallan} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Consignment / Load
                  </label>
                  <select
                    value={selectedLoadId}
                    onChange={(e) => handleLoadSelect(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Manual / Direct Consignment --</option>
                    {storeLoads.map((ld) => (
                      <option key={ld.id} value={ld.id}>
                        {ld.load_number} ({ld.consignee?.name || 'Consignee'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Challan Number
                  </label>
                  <input
                    type="text"
                    value={challanNumber}
                    onChange={(e) => setChallanNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Consignee Name (Delivery Party) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reliance Petrochemicals Ltd"
                    value={consigneeName}
                    onChange={(e) => setConsigneeName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery Address / Destination
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dahej Petrochem Complex, Gujarat"
                    value={consigneeAddress}
                    onChange={(e) => setConsigneeAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Consignee Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98250 12345"
                    value={consigneePhone}
                    onChange={(e) => setConsigneePhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Vehicle Plate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GJ 06 AX 1234"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono uppercase text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Commercial Driver
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weight (Metric Tonnes)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity / Packages
                  </label>
                  <input
                    type="number"
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery Gate / Unloading Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Unloading crane supervisor to verify weights and stamp original copy"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  Issue Challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
