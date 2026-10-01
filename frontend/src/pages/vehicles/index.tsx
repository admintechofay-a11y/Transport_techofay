import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Upload,
  ChevronRight,
  X,
  Gauge,
  Calendar,
} from 'lucide-react';
import { useVehicles, useCreateVehicle } from '@/hooks/use-vehicles';
import { Vehicle } from '@/types/vehicle.types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { DocumentExpiryCard } from '@/components/shared/DocumentExpiryCard';
import { daysUntilExpiry, getExpiryUrgency, formatDate } from '@/lib/utils/date';
import { toast } from 'sonner';

export const VehiclesPage: React.FC = () => {
  const { data: serverVehicles, isLoading } = useVehicles();
  const createVehicleMutation = useCreateVehicle();
  const rawList = Array.isArray(serverVehicles)
    ? serverVehicles
    : ((serverVehicles as any)?.vehicles || (serverVehicles as any)?.data || []);
  const vehicles: Vehicle[] = Array.isArray(rawList) ? rawList : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

  // Form State
  const [formPlate, setFormPlate] = useState('');
  const [formMake, setFormMake] = useState('Tata Motors');
  const [formModel, setFormModel] = useState('');
  const [formCapacity, setFormCapacity] = useState('25');
  const [formBodyType, setFormBodyType] = useState('Closed Container');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formDriverName, setFormDriverName] = useState('');
  const [formFitnessExpiry, setFormFitnessExpiry] = useState('');
  const [formInsuranceExpiry, setFormInsuranceExpiry] = useState('');

  const handleRegisterVehicle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formPlate.trim()) {
      toast.error('Please enter registration plate number (e.g. MH 12 AB 1234)');
      return;
    }
    const cleanPlate = formPlate.trim().toUpperCase();

    try {
      await createVehicleMutation.mutateAsync({
        plate_number: cleanPlate,
        make: formMake,
        model: formModel || `${formMake} Cargo Carrier`,
        capacity_tonnage: Number(formCapacity) || 25,
        capacity_tonnes: Number(formCapacity) || 25,
        vehicle_type: formBodyType,
        status: 'available',
        owner_name: formOwnerName || 'Fleet Asset',
        driver_name: formDriverName || 'Unassigned',
        insurance_expiry: formInsuranceExpiry || undefined,
        fitness_expiry: formFitnessExpiry || undefined,
      });

      setIsAddVehicleOpen(false);
      setFormPlate('');
      setFormModel('');
      setFormOwnerName('');
      setFormDriverName('');
      setFormFitnessExpiry('');
      setFormInsuranceExpiry('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to register vehicle on server');
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      (v.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.make || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.driver_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || (v.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Fleet & Vehicle Asset Registry
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-100 dark:bg-navy-950/60 text-navy-800 dark:text-navy-300">
              {vehicles.length} Trucks
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor truck availability, National Permits, Commercial Insurance, Fitness, and PUC compliance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="px-4 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-saffron-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Filter and Table View */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Plate Number (e.g. MH 04), Make..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'available', 'on_trip', 'maintenance', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'all' ? 'All Fleet' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Registration #</th>
                <th className="py-3 px-4">Make / Specification</th>
                <th className="py-3 px-4">Type & Capacity</th>
                <th className="py-3 px-4">Current Trip / Location</th>
                <th className="py-3 px-4 hidden sm:table-cell">Document Health</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState
                      icon={Truck}
                      title="No Vehicles"
                      description="Register your fleet vehicles to begin tracking"
                      actionLabel="Add Vehicle"
                      onAction={() => setIsAddVehicleOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((veh) => {
                  const npDays = veh.national_permit_expiry ? daysUntilExpiry(veh.national_permit_expiry) : 999;
                  const insDays = veh.insurance_expiry ? daysUntilExpiry(veh.insurance_expiry) : 999;
                  const minDays = Math.min(npDays, insDays);
                  const urgency = getExpiryUrgency(minDays);

                  return (
                    <tr
                      key={veh.id}
                      onClick={() => setSelectedVehicle(veh)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                    >
                      {/* Plate */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-sm text-navy-950 dark:text-white group-hover:text-saffron-600 transition">
                          {veh.plate_number}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                          Odo: {veh.odometer_reading?.toLocaleString()} km
                        </span>
                      </td>

                      {/* Make & Model */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {veh.make} {veh.model}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {veh.fuel_type} • GPS Active
                        </span>
                      </td>

                      {/* Type & Tonnage */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {veh.vehicle_type}
                        </span>
                        <span className="block text-[11px] font-mono font-bold text-navy-700 dark:text-navy-300">
                          {veh.capacity_tonnage} MT
                        </span>
                      </td>

                      {/* Current Trip */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                          {veh.current_trip_corridor}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Driver: {veh.driver_name}
                        </div>
                      </td>

                      {/* Document Health Badges */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {minDays <= 7 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> NP: {minDays}d Left
                            </span>
                          ) : minDays <= 30 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Due in {minDays}d
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> All Compliant
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={veh.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setSelectedVehicle(veh)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
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

      {/* Slide-over Vehicle Detail & Compliance Drawer */}
      {selectedVehicle && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setSelectedVehicle(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-navy-900 dark:text-navy-100">
                    {selectedVehicle.plate_number}
                  </span>
                  <StatusBadge status={selectedVehicle.status} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedVehicle.make} {selectedVehicle.model} • {selectedVehicle.capacity_tonnage} MT
                </p>
              </div>

              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Odometer & Live Status Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Odometer Reading</span>
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedVehicle.odometer_reading?.toLocaleString()} KM
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Driver Assigned</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedVehicle.driver_name}
                  </div>
                </div>
              </div>

              {/* Document Compliance Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Compliance & Regulatory Expiries
                  </h4>
                  <span className="text-[10px] text-slate-400">RTO & Insurance Validity</span>
                </div>

                <DocumentExpiryCard
                  title="National Goods Permit (NP)"
                  documentType="All India Permit"
                  expiresOn={selectedVehicle.national_permit_expiry || new Date().toISOString()}
                  documentNumber="NP-2024-MH-99120"
                  onRenew={() => toast.info('Opening National Permit renewal form...')}
                  onView={() => toast.info('Previewing National Permit document...')}
                />

                <DocumentExpiryCard
                  title="Commercial Vehicle Insurance"
                  documentType="Comprehensive Policy"
                  expiresOn={selectedVehicle.insurance_expiry || new Date().toISOString()}
                  documentNumber="POL-ICICI-882910"
                  onRenew={() => toast.info('Opening Insurance renewal form...')}
                  onView={() => toast.info('Previewing Insurance policy...')}
                />

                <DocumentExpiryCard
                  title="Fitness Certificate (Form 38)"
                  documentType="RTO Fitness"
                  expiresOn={selectedVehicle.fitness_expiry || new Date().toISOString()}
                  documentNumber="FC-MH04-2025"
                  onRenew={() => toast.info('Opening Fitness renewal...')}
                  onView={() => toast.info('Previewing Fitness certificate...')}
                />

                <DocumentExpiryCard
                  title="Pollution Under Control (PUC)"
                  documentType="Emission Certificate"
                  expiresOn={selectedVehicle.puc_expiry || new Date().toISOString()}
                  documentNumber="PUC-2026-8812"
                  onRenew={() => toast.info('Opening PUC update...')}
                  onView={() => toast.info('Previewing PUC document...')}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Vehicle Modal */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-saffron-500" />
                Register New Fleet Vehicle
              </h3>
              <button onClick={() => setIsAddVehicleOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Plate Number (e.g. MH 12 AB 1234) *
                </label>
                <input
                  type="text"
                  required
                  value={formPlate}
                  onChange={(e) => setFormPlate(e.target.value)}
                  placeholder="e.g. MH 12 AB 1234"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono uppercase focus:ring-2 focus:ring-saffron-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Manufacturer / Make *
                  </label>
                  <select
                    value={formMake}
                    onChange={(e) => setFormMake(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  >
                    <option>Tata Motors</option>
                    <option>Ashok Leyland</option>
                    <option>BharatBenz</option>
                    <option>Eicher Motors</option>
                    <option>Mahindra</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Capacity (Tonnage MT) *
                  </label>
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Body Type
                  </label>
                  <select
                    value={formBodyType}
                    onChange={(e) => setFormBodyType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  >
                    <option>Closed Container</option>
                    <option>Open Body High Bed</option>
                    <option>Container Trailer</option>
                    <option>Tanker</option>
                    <option>Flat Bed Trailer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Driver Name
                  </label>
                  <input
                    type="text"
                    value={formDriverName}
                    onChange={(e) => setFormDriverName(e.target.value)}
                    placeholder="e.g. Driver Full Name"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formInsuranceExpiry}
                    onChange={(e) => setFormInsuranceExpiry(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fitness Certificate Expiry
                  </label>
                  <input
                    type="date"
                    value={formFitnessExpiry}
                    onChange={(e) => setFormFitnessExpiry(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRegisterVehicle()}
                  className="px-5 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold transition-all shadow-md shadow-saffron-500/20 active:scale-95"
                >
                  Register Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
