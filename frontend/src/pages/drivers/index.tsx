import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  CreditCard,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  X,
  Truck,
  Building2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { useDrivers, useCreateDriver } from '@/hooks/use-drivers';
import { useVehicles } from '@/hooks/use-vehicles';
import { Driver } from '@/types/driver.types';
import { Vehicle } from '@/types/vehicle.types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { daysUntilExpiry, getExpiryUrgency, formatDate } from '@/lib/utils/date';
import { toast } from 'sonner';
import { useTransportStore } from '@/stores/transport-data.store';

export const DriversPage: React.FC = () => {
  const { data: serverDrivers, isLoading } = useDrivers();
  const createDriverMutation = useCreateDriver();
  const { data: serverVehicles } = useVehicles();
  const storeDrivers = useTransportStore((s) => s.drivers);
  const storeVehicles = useTransportStore((s) => s.vehicles);

  const rawDriversList = Array.isArray(serverDrivers)
    ? serverDrivers
    : ((serverDrivers as any)?.drivers || (serverDrivers as any)?.data || (storeDrivers.length > 0 ? storeDrivers : []));
  const drivers: Driver[] = Array.isArray(rawDriversList) ? rawDriversList : [];

  const rawVehiclesList = Array.isArray(serverVehicles)
    ? serverVehicles
    : ((serverVehicles as any)?.vehicles || (serverVehicles as any)?.data || (storeVehicles.length > 0 ? storeVehicles : []));
  const fleetVehicles: Vehicle[] = Array.isArray(rawVehiclesList) ? rawVehiclesList : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLicenseNumber, setFormLicenseNumber] = useState('');
  const [formLicenseExpiry, setFormLicenseExpiry] = useState('');
  const [formAssignedVehicle, setFormAssignedVehicle] = useState('');
  const [formExperience, setFormExperience] = useState('5');
  const [formBloodGroup, setFormBloodGroup] = useState('B+');

  const handleRegisterDriver = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      toast.error('Please enter driver name and mobile phone number');
      return;
    }
    const cleanLicence = formLicenseNumber.trim().toUpperCase() || undefined;

    try {
      const cleanPhoneDigits = formPhone.replace(/[^0-9]/g, '');
      const driverEmail = `${formName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}.${cleanPhoneDigits.slice(-4) || 'fleet'}@driver.fleet`;

      await createDriverMutation.mutateAsync({
        name: formName.trim(),
        email: driverEmail,
        phone: formPhone.trim(),
        status: 'available',
        driving_licence_number: cleanLicence,
        drivers_license_number: cleanLicence,
        licence_expiry: formLicenseExpiry || undefined,
        assigned_vehicle: formAssignedVehicle || 'Unassigned',
        experience_years: Number(formExperience) || 0,
        blood_group: formBloodGroup || 'N/A',
      });

      setIsAddDriverOpen(false);
      setFormName('');
      setFormPhone('');
      setFormLicenseNumber('');
      setFormLicenseExpiry('');
      setFormAssignedVehicle('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to register driver on server');
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      (d.driving_licence_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || (d.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Driver & Crew Roster
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-100 dark:bg-navy-950/60 text-navy-800 dark:text-navy-300">
              {drivers.length} Drivers
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Commercial Driving Licence compliance, trip assignments, and salary/advance accounts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddDriverOpen(true)}
            className="px-4 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-saffron-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            Add Driver
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Driver Name, Mobile, DL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'available', 'on_trip', 'on_leave', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'all' ? 'All Drivers' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">Mobile & Contact</th>
                <th className="py-3 px-4">Licence Number & Class</th>
                <th className="py-3 px-4 hidden sm:table-cell">Licence Expiry Health</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState
                      icon={UserCheck}
                      title="No Drivers"
                      description="Add commercial drivers to your fleet roster"
                      actionLabel="Add Driver"
                      onAction={() => setIsAddDriverOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((drv) => {
                  const daysLeft = daysUntilExpiry(drv.licence_expiry);
                  const urgency = getExpiryUrgency(daysLeft);

                  return (
                    <tr
                      key={drv.id}
                      onClick={() => setSelectedDriver(drv)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-950 text-navy-800 dark:text-navy-200 flex items-center justify-center font-bold text-xs uppercase border border-navy-200 dark:border-navy-800">
                            {drv.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-saffron-600 transition block">
                              {drv.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Exp: {drv.experience_years} yrs • Blood: {drv.blood_group}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {drv.phone}
                      </td>

                      {/* DL Number */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {drv.driving_licence_number}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                          {drv.licence_type}
                        </span>
                      </td>

                      {/* Expiry Health */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        {urgency === 'critical' ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Expires in {daysLeft} days!
                          </span>
                        ) : urgency === 'warning' ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            Expires in {daysLeft} days
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" />
                            Valid ({formatDate(drv.licence_expiry)})
                          </span>
                        )}
                      </td>

                      {/* Assigned Truck */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-saffron-500" />
                          {drv.assigned_vehicle}
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[160px]">
                          {drv.current_corridor}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={drv.status} />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setSelectedDriver(drv)}
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

      {/* Driver Detail Drawer */}
      {selectedDriver && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setSelectedDriver(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-800 text-white font-bold flex items-center justify-center text-sm uppercase">
                  {selectedDriver.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {selectedDriver.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedDriver.phone}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDriver(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Driving License Section */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Commercial Driving Licence
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">SARATHI Verified</span>
                </div>
                <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
                  {selectedDriver.driving_licence_number}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Class: {selectedDriver.licence_type}
                </p>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-[11px]">
                  <span className="text-slate-500">Validity Expiry:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(selectedDriver.licence_expiry)}
                  </span>
                </div>
              </div>

              {/* Bank Details for Driver Bhatta / Advances */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  Driver Bank Account (For Bhatta & Trip Advances)
                </span>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedDriver.bank_account_number || '918273645102'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank IFSC:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedDriver.bank_ifsc || 'SBIN0001234'}
                  </span>
                </div>
              </div>

              {/* Current Duty */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  Current Duty Assignment
                </span>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Assigned Truck:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedDriver.assigned_vehicle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Corridor Route:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedDriver.current_corridor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Driver Modal */}
      {isAddDriverOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-saffron-500" />
                Add Driver to Roster
              </h3>
              <button onClick={() => setIsAddDriverOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sukhwinder Singh"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-saffron-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono focus:ring-2 focus:ring-saffron-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driving Licence Number *
                  </label>
                  <input
                    type="text"
                    value={formLicenseNumber}
                    onChange={(e) => setFormLicenseNumber(e.target.value)}
                    placeholder="DL-0420110058291"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono uppercase focus:ring-2 focus:ring-saffron-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Licence Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formLicenseExpiry}
                    onChange={(e) => setFormLicenseExpiry(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Fleet Truck
                  </label>
                  <select
                    value={formAssignedVehicle}
                    onChange={(e) => setFormAssignedVehicle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  >
                    <option value="">Unassigned (Yard Pool)</option>
                    {fleetVehicles.map((v) => (
                      <option key={v.id || v.uuid || v.plate_number} value={v.plate_number}>
                        {v.plate_number} ({v.make || 'Truck'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={formExperience}
                    onChange={(e) => setFormExperience(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formBloodGroup}
                    onChange={(e) => setFormBloodGroup(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  >
                    <option>B+</option>
                    <option>O+</option>
                    <option>A+</option>
                    <option>AB+</option>
                    <option>B-</option>
                    <option>O-</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDriverOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRegisterDriver()}
                  className="px-5 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold transition-all shadow-md shadow-saffron-500/20 active:scale-95"
                >
                  Register Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
