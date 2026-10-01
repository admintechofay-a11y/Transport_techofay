import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Users,
  FileText,
  Receipt,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Package,
  Plus,
  Share2,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LoadTrendChart } from '@/components/dashboard/LoadTrendChart';
import { VehicleStatusChart } from '@/components/dashboard/VehicleStatusChart';
import { ExpiryAlertList } from '@/components/dashboard/ExpiryAlertList';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WhatsAppShareButton } from '@/components/shared/WhatsAppShareButton';
import { HeroAdmissionBanner } from '@/components/shared/HeroAdmissionBanner';
import { useDashboardMetrics } from '@/hooks/use-dashboard';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { useTransportStore } from '@/stores/transport-data.store';
import { Vehicle } from '@/types/vehicle.types';
import { Driver } from '@/types/driver.types';
import { formatINR } from '@/lib/utils/currency';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: metrics, isLoading, refetch } = useDashboardMetrics();
  const { data: serverVehicles } = useVehicles();
  const { data: serverDrivers } = useDrivers();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setFabOpen(false);
      }
    };
    if (fabOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fabOpen]);

  // Subscribe directly to reactive transport store
  const loads = useTransportStore((s) => s.loads);
  const vehicles = useTransportStore((s) => s.vehicles);
  const drivers = useTransportStore((s) => s.drivers);
  const bilties = useTransportStore((s) => s.bilties);
  const lrNumbers = useTransportStore((s) => s.lrNumbers);
  const customers = useTransportStore((s) => s.customers);

  const liveVehicles: Vehicle[] = Array.isArray(serverVehicles)
    ? serverVehicles
    : ((serverVehicles as any)?.vehicles || (serverVehicles as any)?.data || vehicles);

  const liveDrivers: Driver[] = Array.isArray(serverDrivers)
    ? serverDrivers
    : ((serverDrivers as any)?.drivers || (serverDrivers as any)?.data || drivers);

  const activeVehiclesList = (liveVehicles && liveVehicles.length > 0) ? liveVehicles : vehicles;
  const activeDriversList = (liveDrivers && liveDrivers.length > 0) ? liveDrivers : drivers;

  const totalRegisteredFreight = loads.reduce((sum: number, l: any) => sum + (Number(l.total_freight) || 0), 0);
  const availableVehiclesCount = activeVehiclesList.filter((v) => v.status === 'available' || v.status === 'active' || !v.status).length;
  const onTripDriversCount = activeDriversList.filter((d) => d.status === 'on_trip').length;

  const stats = {
    activeLoads: loads.length > 0 ? loads.length : (metrics?.today_loads ?? 0),
    availableVehicles: availableVehiclesCount > 0 ? availableVehiclesCount : (metrics?.vehicles_available ?? activeVehiclesList.length),
    driversOnTrip: onTripDriversCount > 0 ? onTripDriversCount : (metrics?.drivers_on_trip ?? 0),
    pendingLrs: lrNumbers.length > 0 ? lrNumbers.filter((l) => l.status === 'generated' || l.status === 'pending').length : (metrics?.pending_lrs ?? 0),
    pendingBilties: bilties.length > 0 ? bilties.filter((b) => b.status === 'issued' || b.status === 'pending').length : (metrics?.pending_bilties ?? 0),
    freightToday: totalRegisteredFreight > 0 ? totalRegisteredFreight : (metrics?.total_freight_today ?? 0),
    pendingPods: metrics?.pending_pods ?? 0,
    expiringDocs: activeVehiclesList.filter((v) => v.insurance_expiry && new Date(v.insurance_expiry) < new Date(Date.now() + 60 * 86400000)).length,
  };

  const recentLoads = loads.slice(0, 8).map((l: any) => ({
    id: l.load_number || l.id,
    from: l.origin_location?.name || 'Origin',
    to: l.destination_location?.name || 'Destination',
    consignor: l.consignor?.name || 'Consignor',
    vehicle: l.vehicle?.plate_number || 'TBD',
    driver: l.driver?.name || 'Driver',
    status: l.status || 'pending',
    eta: 'Active Load',
    freight: Number(l.total_freight) || 0,
  }));
return (
    <div className="space-y-6">
      {/* Hero Admission & Intake Section with Techofay Global Ventures Templates */}
      <HeroAdmissionBanner onLoadCreated={() => refetch()} />

      {/* 8 Primary Operations KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Active Consignments"
          value={stats.activeLoads}
          subtext="Loads currently moving across corridors"
          icon={Package}
          variant="primary"
          badge={stats.activeLoads > 0 ? `${stats.activeLoads} active` : undefined}
          onClick={() => navigate('/loads')}
        />
        <KpiCard
          title="Fleet Available"
          value={stats.availableVehicles}
          subtext="Ready for dispatch / loading"
          icon={Truck}
          variant="success"
          badge={stats.availableVehicles > 0 ? `${stats.availableVehicles} ready` : undefined}
          onClick={() => navigate('/vehicles')}
        />
        <KpiCard
          title="Drivers On Trip"
          value={stats.driversOnTrip}
          subtext="Active duty on assigned routes"
          icon={Users}
          variant="primary"
          badge={stats.driversOnTrip > 0 ? `${stats.driversOnTrip} on duty` : undefined}
          onClick={() => navigate('/drivers')}
        />
        <KpiCard
          title="Pending LRs"
          value={stats.pendingLrs}
          subtext="Awaiting Lorry Receipt generation"
          icon={FileText}
          variant="warning"
          badge={stats.pendingLrs > 0 ? `${stats.pendingLrs} pending` : undefined}
          onClick={() => navigate('/lr-numbers')}
        />

        <KpiCard
          title="Pending Bilties"
          value={stats.pendingBilties}
          subtext="Unbilled consignment notes"
          icon={Receipt}
          variant="primary"
          badge={stats.pendingBilties > 0 ? `${stats.pendingBilties} unbilled` : undefined}
          onClick={() => navigate('/bilties')}
        />
        <KpiCard
          title="Freight Booked Today"
          value={formatINR(stats.freightToday)}
          subtext="Gross billing revenue booked"
          icon={IndianRupee}
          variant="primary"
          badge={stats.freightToday > 0 ? 'Live billing' : undefined}
          onClick={() => navigate('/freight')}
        />
        <KpiCard
          title="Pending PODs"
          value={stats.pendingPods}
          subtext="Consignments delivered without POD upload"
          icon={CheckCircle2}
          variant="warning"
          badge={stats.pendingPods > 0 ? `${stats.pendingPods} pending` : undefined}
          onClick={() => navigate('/loads')}
        />
        <KpiCard
          title="Expiring Documents"
          value={stats.expiringDocs}
          subtext="Fitness, Insurance & DLs due < 30d"
          icon={AlertTriangle}
          variant={stats.expiringDocs > 0 ? 'danger' : 'success'}
          badge={stats.expiringDocs > 0 ? `${stats.expiringDocs} renewals` : undefined}
          onClick={() => navigate('/vehicles')}
        />
      </div>

      {/* Central Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LoadTrendChart />
        </div>
        <div>
          <VehicleStatusChart
            available={activeVehiclesList.filter((v) => v.status === 'available' || !v.status).length}
            onTrip={activeVehiclesList.filter((v) => v.status === 'on_trip').length || activeDriversList.filter((d) => d.status === 'on_trip').length}
            maintenance={activeVehiclesList.filter((v) => v.status === 'under_maintenance' || v.status === 'maintenance').length}
            inactive={activeVehiclesList.filter((v) => v.status === 'inactive').length}
          />
        </div>
      </div>

      {/* Bottom Row: Compliance Alerts & Active Corridor Shipments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance / Document Expirations */}
        <div className="lg:col-span-1">
          <ExpiryAlertList />
        </div>

        {/* Live Active Shipments Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-navy-50 dark:bg-navy-950/60 rounded-lg text-navy-700 dark:text-navy-300">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Active Dispatch Stream
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Corridor movements and consignments in motion
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/loads')}
              className="text-xs font-semibold text-saffron-600 hover:text-saffron-700 dark:text-saffron-400 flex items-center gap-1 transition"
            >
              All Consignments <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">Load ID</th>
                  <th className="pb-3">Route (Origin → Destination)</th>
                  <th className="pb-3">Consignor</th>
                  <th className="pb-3">Assigned Truck & Driver</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Freight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentLoads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No active consignments registered yet. Click "+ Quick Intake / Admission" above to book your first load.
                    </td>
                  </tr>
                ) : recentLoads.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/loads?id=${row.id}`)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3.5 pl-2 font-mono font-bold text-navy-900 dark:text-navy-200">
                      {row.id}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-saffron-500 shrink-0" />
                        <span>{row.from}</span>
                        <span className="text-slate-400">→</span>
                        <span>{row.to}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block pl-5 mt-0.5">
                        ETA: {row.eta}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {row.consignor}
                    </td>
                    <td className="py-3.5">
                      <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {row.vehicle}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {row.driver}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-3.5 text-right pr-2 font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(row.freight)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Direct WhatsApp Share Modal */}
      {showWhatsAppModal && (
        <WhatsAppShareButton
          documentType="lr"
          documentNumber="LR-2026-0042"
          recipientName="Ramesh Logistics"
          recipientPhone="+919876543210"
          defaultMessage="Dear Ramesh Logistics, your LR #LR-2026-0042 for shipment Mumbai to Bhiwandi has been generated. Track load here: https://track.techofay.com/lr/42"
        />
      )}

      {/* Floating Action Button (FAB) for Quick Record Creation */}
      <div ref={fabRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Animated Action Pills */}
        {fabOpen && (
          <div className="flex flex-col items-end gap-2.5 mb-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {[
              { label: 'New Load', path: '/loads', icon: Package },
              { label: 'Add Vehicle', path: '/vehicles', icon: Truck },
              { label: 'Add Driver', path: '/drivers', icon: UserCheck },
              { label: 'New LR', path: '/lr-numbers', icon: FileText },
            ].map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <div
                  key={action.label}
                  className="flex items-center flex-row-reverse gap-2.5 group cursor-pointer transition-all"
                  style={{ transitionDelay: `${index * 50}ms` }}
                  onClick={() => {
                    navigate(action.path);
                    setFabOpen(false);
                  }}
                >
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-saffron-500 hover:bg-saffron-600 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95"
                    title={action.label}
                  >
                    <ActionIcon className="w-5 h-5 stroke-[2]" />
                  </button>
                  <span className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-md border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 whitespace-nowrap group-hover:bg-slate-50 dark:group-hover:bg-slate-700 transition">
                    {action.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Main Circular Toggle Button */}
        <button
          type="button"
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 rounded-full bg-saffron-500 hover:bg-saffron-600 text-white shadow-xl shadow-saffron-500/35 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-hidden ${
            fabOpen ? 'rotate-45' : 'rotate-0'
          }`}
          title="Quick Actions"
          aria-label="Quick Actions Menu"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
