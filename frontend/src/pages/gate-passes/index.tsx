import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Truck,
  User,
  Clock,
  Printer,
  ChevronRight,
  X,
  ArrowRightLeft,
  CheckCircle2,
  Share2,
  Calendar,
  AlertCircle,
  LogOut,
  LogIn,
} from 'lucide-react';
import { GatePass } from '@/types/delivery-challan.types';
import { formatDateTime, formatDate } from '@/lib/utils/date';
import { downloadGatePassPdf } from '@/lib/pdf-downloader';
import {
  useGatePasses,
  useCreateGatePass,
  useRecordGatePassExit,
  useDeleteGatePass,
} from '@/hooks/use-delivery-challans';
import { gatePassApi } from '@/lib/api/delivery-challans.api';
import { useLoads } from '@/hooks/use-loads';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { toast } from 'sonner';

export const GatePassesPage: React.FC = () => {
  const { data: gatePassesResponse, isLoading } = useGatePasses();
  const createGatePassMutation = useCreateGatePass();
  const recordExitMutation = useRecordGatePassExit();
  const deleteGatePassMutation = useDeleteGatePass();

  const { data: serverLoads } = useLoads();
  const { data: serverVehicles } = useVehicles();
  const { data: serverDrivers } = useDrivers();

  const rawPasses = Array.isArray(gatePassesResponse) ? gatePassesResponse : (gatePassesResponse as any)?.data || [];
  const storeLoads = Array.isArray(serverLoads) ? serverLoads : (serverLoads as any)?.data || [];
  const storeVehicles = Array.isArray(serverVehicles) ? serverVehicles : (serverVehicles as any)?.data || [];
  const storeDrivers = Array.isArray(serverDrivers) ? serverDrivers : (serverDrivers as any)?.data || [];

  const storeGatePasses: GatePass[] = rawPasses;

  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'out' | 'in'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);

  // Form State
  const [passType, setPassType] = useState<'out' | 'in'>('out');
  const [passNumber, setPassNumber] = useState('');
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [securityPost, setSecurityPost] = useState('Main Gate Checkpost 1');
  const [securityOfficer, setSecurityOfficer] = useState('Inspector R. Sharma');
  const [authorizedBy, setAuthorizedBy] = useState('Fleet Operations In-Charge');
  const [remarks, setRemarks] = useState('');

  const openCreateModal = () => {
    const nextSeq = Math.floor(1000 + Math.random() * 9000);
    setPassNumber(`GP-${new Date().getFullYear()}-${nextSeq}`);
    setPassType('out');
    if (storeLoads.length > 0) {
      handleLoadSelect(String(storeLoads[0].id || storeLoads[0].load_number || ''));
    } else {
      setSelectedLoadId('');
      setVehiclePlate(storeVehicles[0]?.plate_number || '');
      setDriverName(storeDrivers[0]?.name || '');
    }
    setRemarks('Container seal intact; weight bridge slips and bilty verified.');
    setIsCreateOpen(true);
  };

  const handleLoadSelect = (loadId: string) => {
    setSelectedLoadId(loadId);
    const found = storeLoads.find((l) => l.id === loadId || l.load_number === loadId);
    if (found) {
      setVehiclePlate(found.vehicle?.plate_number || '');
      setDriverName(found.driver?.name || '');
      setRemarks(`Outward cargo dispatch to ${found.destination_location?.name || 'Customer'}. Seal inspected.`);
    }
  };

  const handleSaveGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiclePlate.trim()) {
      toast.error('Vehicle plate number is required');
      return;
    }

    const selectedLoad = storeLoads.find((l: any) => l.id === selectedLoadId || l.load_number === selectedLoadId || l.uuid === selectedLoadId);

    const payload: Partial<GatePass> = {
      gate_pass_number: passNumber.trim(),
      pass_type: passType,
      load_uuid: selectedLoad?.uuid || selectedLoadId || undefined,
      vehicle: {
        plate_number: vehiclePlate.trim().toUpperCase(),
      },
      driver: {
        name: driverName.trim() || 'Driver',
      },
      authorized_by: authorizedBy.trim(),
      security_name: securityOfficer.trim(),
      remarks: remarks.trim(),
    };

    try {
      await createGatePassMutation.mutateAsync(payload);
      setIsCreateOpen(false);
    } catch (err: any) {
      // toast handled by hook
    }
  };

  const handleRecordExit = async (pass: GatePass) => {
    try {
      const updated = await recordExitMutation.mutateAsync(pass.uuid || String(pass.id));
      if (selectedPass?.uuid === pass.uuid) {
        setSelectedPass(updated);
      }
    } catch (err: any) {
      // toast handled by hook
    }
  };

  const handleWhatsAppShare = (g: GatePass) => {
    const text = `*TERMINAL GATE SECURITY PASS*\nPass No: *${g.gate_pass_number}*\nType: ${(g.pass_type === 'out' ? 'OUTWARD DISPATCH' : 'INWARD ENTRY')}\nTruck: *${g.vehicle?.plate_number}*\nDriver: ${g.driver?.name || 'N/A'}\nLoad Ref: ${g.order?.load_number || 'General Yard'}\nSecurity: ${g.security_name} (${g.authorized_by})\nExit Time: ${g.out_time ? formatDateTime(g.out_time) : 'Recorded on gate'}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filter
  const filtered = storeGatePasses.filter((g) => {
    const matchesSearch =
      g.gate_pass_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.vehicle?.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.driver?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.order?.load_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (directionFilter === 'out') return g.pass_type === 'out';
    if (directionFilter === 'in') return g.pass_type === 'in';
    return true;
  });

  const totalOutward = storeGatePasses.filter((g) => g.pass_type === 'out').length;
  const totalInward = storeGatePasses.filter((g) => g.pass_type === 'in').length;
  const totalCompletedExits = storeGatePasses.filter((g) => Boolean(g.out_time)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Gate Passes & Terminal Security
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#0F2D56] text-amber-300">
              {storeGatePasses.length} Passes
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log inward/outward security clearance passes for trucks, trailers, and cargo manifest verification
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Issue Gate Pass
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Passes Logged</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{storeGatePasses.length}</span>
            <span className="text-[11px] text-slate-400">All terminal movements</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Outward Cargo Dispatch</span>
            <span className="text-2xl font-bold text-amber-600 font-mono mt-0.5 block">{totalOutward}</span>
            <span className="text-[11px] text-amber-600/80">Exited with shipment load</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Inward Terminal Entry</span>
            <span className="text-2xl font-bold text-emerald-600 font-mono mt-0.5 block">{totalInward}</span>
            <span className="text-[11px] text-emerald-600/80">Yard docking & loading</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <LogIn className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Exits Cleared & Stamped</span>
            <span className="text-2xl font-bold text-purple-600 font-mono mt-0.5 block">{totalCompletedExits}</span>
            <span className="text-[11px] text-purple-600/80">Logged out of gate</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search & Tabs */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Gate Pass #, Plate, Driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-200/70 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setDirectionFilter('all')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                directionFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Passes ({storeGatePasses.length})
            </button>
            <button
              onClick={() => setDirectionFilter('out')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                directionFilter === 'out'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Outward ({totalOutward})
            </button>
            <button
              onClick={() => setDirectionFilter('in')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                directionFilter === 'in'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Inward ({totalInward})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Pass #</th>
                <th className="py-3 px-4">Pass Direction</th>
                <th className="py-3 px-4">Truck Plate</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Load Reference</th>
                <th className="py-3 px-4">Security Officer</th>
                <th className="py-3 px-4">Gate In / Out Timestamps</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No Gate Passes Recorded</p>
                    <p className="text-xs text-slate-400 mt-1">Issue an inward or outward gate clearance pass to track vehicle access.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr
                    key={g.uuid}
                    onClick={() => setSelectedPass(g)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                      {g.gate_pass_number}
                      <span className="text-[10px] text-slate-400 block font-sans font-normal">
                        {g.created_at ? formatDate(g.created_at) : 'Today'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          g.pass_type === 'out'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {g.pass_type === 'out' ? <LogOut className="w-3 h-3" /> : <LogIn className="w-3 h-3" />}
                        {g.pass_type === 'out' ? 'Outward Pass' : 'Inward Pass'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {g.vehicle?.plate_number || 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {g.driver?.name || 'Driver'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 font-semibold">
                      {g.order?.load_number || '-'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {g.security_name || 'Inspector Duty'}
                      </div>
                      <span className="text-[10px] text-slate-400 block">{g.authorized_by || 'Gate Post'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">IN:</span>
                        <span>{g.in_time ? formatDateTime(g.in_time) : 'Registered'}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-slate-400">OUT:</span>
                        {g.out_time ? (
                          <span className="text-emerald-600 font-semibold">{formatDateTime(g.out_time)}</span>
                        ) : (
                          <span className="text-amber-600">Pending Exit</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!g.out_time && (
                          <button
                            onClick={() => handleRecordExit(g)}
                            className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Stamp Exit Time"
                          >
                            <LogOut className="w-3 h-3" />
                            Stamp Exit
                          </button>
                        )}

                        <button
                          onClick={() => handleWhatsAppShare(g)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition"
                          title="Share Pass on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            downloadGatePassPdf({
                              gatePassNumber: g.gate_pass_number,
                              passType: g.pass_type === 'out' ? 'Outward' : 'Inward',
                              vehiclePlate: g.vehicle?.plate_number,
                              driverName: g.driver?.name,
                              orderNumber: g.order?.load_number,
                              securityName: g.security_name,
                              authorizedBy: g.authorized_by,
                              inTime: g.in_time ? formatDateTime(g.in_time) : undefined,
                              outTime: g.out_time ? formatDateTime(g.out_time) : undefined,
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                          title="Print Gate Pass PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedPass(g)}
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

      {/* Drawer */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    {selectedPass.gate_pass_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedPass.pass_type === 'out'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedPass.pass_type === 'out' ? 'Outward Pass' : 'Inward Pass'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Logged: {formatDateTime(selectedPass.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPass(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider block">Security Clearance</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Gate Post:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedPass.security_name || 'Main Gate 1'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorized By:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedPass.authorized_by || 'Officer In-Charge'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gate Entry In Time:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{selectedPass.in_time ? formatDateTime(selectedPass.in_time) : 'Recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gate Exit Out Time:</span>
                  <span className="font-mono text-emerald-600 font-bold">{selectedPass.out_time ? formatDateTime(selectedPass.out_time) : 'Pending Exit'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider block">Vehicle & Consignment</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Truck Plate:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedPass.vehicle?.plate_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commercial Driver:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedPass.driver?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Associated Load:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedPass.order?.load_number || 'General Clearance'}</span>
                </div>
              </div>

              {selectedPass.remarks && (
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Inspection Notes:</span>
                  <p className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 italic text-[11px]">
                    "{selectedPass.remarks}"
                  </p>
                </div>
              )}

              {!selectedPass.out_time && (
                <button
                  onClick={() => handleRecordExit(selectedPass)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Stamp Vehicle Gate Exit
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() =>
                  downloadGatePassPdf({
                    gatePassNumber: selectedPass.gate_pass_number,
                    passType: selectedPass.pass_type === 'out' ? 'Outward' : 'Inward',
                    vehiclePlate: selectedPass.vehicle?.plate_number,
                    driverName: selectedPass.driver?.name,
                    orderNumber: selectedPass.order?.load_number,
                    securityName: selectedPass.security_name,
                    authorizedBy: selectedPass.authorized_by,
                    inTime: selectedPass.in_time ? formatDateTime(selectedPass.in_time) : undefined,
                    outTime: selectedPass.out_time ? formatDateTime(selectedPass.out_time) : undefined,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                Print Gate Pass PDF
              </button>

              <button
                onClick={() => handleWhatsAppShare(selectedPass)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-4 h-4" />
                Share Security Pass on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fast Issue Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Issue Terminal Security Gate Pass
              </h3>
              <button onClick={() => setIsCreateOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveGatePass} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pass Direction *
                  </label>
                  <select
                    value={passType}
                    onChange={(e) => setPassType(e.target.value as 'out' | 'in')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="out">Outward Pass (Truck leaving yard with load)</option>
                    <option value="in">Inward Pass (Truck entering yard for loading/unloading)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pass Number
                  </label>
                  <input
                    type="text"
                    value={passNumber}
                    onChange={(e) => setPassNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Active Consignment Load (Optional)
                  </label>
                  <select
                    value={selectedLoadId}
                    onChange={(e) => handleLoadSelect(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="">-- General Yard Access / No specific load --</option>
                    {storeLoads.map((ld) => (
                      <option key={ld.id} value={ld.id}>
                        {ld.load_number} ({ld.vehicle?.plate_number || 'Truck'} &bull; {ld.consignee?.name || 'Receiver'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Truck Plate Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GJ 06 AX 1234"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono uppercase text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Name
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
                    Security Gate Post
                  </label>
                  <input
                    type="text"
                    value={securityPost}
                    onChange={(e) => setSecurityPost(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Security Officer
                  </label>
                  <input
                    type="text"
                    value={securityOfficer}
                    onChange={(e) => setSecurityOfficer(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo Seal & Verification Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Seal integrity checked, weight verified on weighbridge"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  Authorize & Issue Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
