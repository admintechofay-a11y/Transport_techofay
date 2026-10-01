import React from 'react';
import { AlertTriangle, Clock, ChevronRight, FileText, UserCheck, CheckCircle2 } from 'lucide-react';
import { daysUntilExpiry, getExpiryUrgency, formatDate } from '@/lib/utils/date';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';

export interface ExpiryAlertItem {
  id: string;
  type: 'vehicle_doc' | 'driver_license';
  title: string;
  subtitle: string;
  documentType: string;
  expiresOn: string;
  entityId: string;
}

interface ExpiryAlertListProps {
  alerts?: ExpiryAlertItem[];
  onViewDoc?: (item: ExpiryAlertItem) => void;
}

export const ExpiryAlertList: React.FC<ExpiryAlertListProps> = ({
  alerts: propsAlerts,
  onViewDoc,
}) => {
  const navigate = useNavigate();
  const { data: serverVehicles } = useVehicles();
  const { data: serverDrivers } = useDrivers();
  const vehicles = Array.isArray(serverVehicles) ? serverVehicles : ((serverVehicles as any)?.vehicles || (serverVehicles as any)?.data || []);
  const drivers = Array.isArray(serverDrivers) ? serverDrivers : ((serverDrivers as any)?.drivers || (serverDrivers as any)?.data || []);

  const alerts: ExpiryAlertItem[] = React.useMemo(() => {
    if (propsAlerts) return propsAlerts;

    const items: ExpiryAlertItem[] = [];

    // Check drivers
    drivers.forEach((d) => {
      const expiry = d.licence_expiry || d.drivers_license_expiry;
      if (expiry) {
        const days = daysUntilExpiry(expiry);
        if (days <= 30) {
          items.push({
            id: `dr-exp-${d.id || d.name}`,
            type: 'driver_license',
            title: d.name,
            subtitle: `DL: ${d.driving_licence_number || d.drivers_license_number || 'Tracked'}`,
            documentType: 'Driving Licence',
            expiresOn: expiry,
            entityId: String(d.id || ''),
          });
        }
      }
    });

    // Check vehicles
    vehicles.forEach((v) => {
      if (v.insurance_expiry) {
        const days = daysUntilExpiry(v.insurance_expiry);
        if (days <= 30) {
          items.push({
            id: `vh-ins-${v.id || v.plate_number}`,
            type: 'vehicle_doc',
            title: `${v.plate_number} (${v.make || 'Truck'})`,
            subtitle: 'Commercial Vehicle Insurance Policy',
            documentType: 'Insurance',
            expiresOn: v.insurance_expiry,
            entityId: String(v.id || ''),
          });
        }
      }
      if (v.fitness_expiry) {
        const days = daysUntilExpiry(v.fitness_expiry);
        if (days <= 30) {
          items.push({
            id: `vh-fit-${v.id || v.plate_number}`,
            type: 'vehicle_doc',
            title: `${v.plate_number} (${v.make || 'Truck'})`,
            subtitle: 'Vehicle Fitness Certificate',
            documentType: 'Fitness',
            expiresOn: v.fitness_expiry,
            entityId: String(v.id || ''),
          });
        }
      }
      if (v.national_permit_expiry || v.permit_expiry) {
        const expiry = v.national_permit_expiry || v.permit_expiry;
        if (expiry) {
          const days = daysUntilExpiry(expiry);
          if (days <= 30) {
            items.push({
              id: `vh-perm-${v.id || v.plate_number}`,
              type: 'vehicle_doc',
              title: `${v.plate_number} (${v.make || 'Truck'})`,
              subtitle: 'Goods Vehicle National Permit',
              documentType: 'Permit',
              expiresOn: expiry,
              entityId: String(v.id || ''),
            });
          }
        }
      }
    });

    return items;
  }, [propsAlerts, vehicles, drivers]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Compliance & Expiry Alerts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Documents requiring renewal within 30 days
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/vehicles')}
          className="text-xs font-semibold text-saffron-600 hover:text-saffron-700 dark:text-saffron-400 flex items-center gap-1 transition"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">All compliance documents are up to date</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No renewals due within 30 days for registered fleet and crew</p>
          </div>
        ) : (
          alerts.map((item) => {
            const daysLeft = daysUntilExpiry(item.expiresOn);
            const urgency = getExpiryUrgency(daysLeft);

            const badgeStyles = {
              critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900',
              warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
              healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
            }[urgency];

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 shadow-xs">
                    {item.type === 'driver_license' ? (
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-saffron-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {item.documentType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-2.5 py-1 rounded-md border text-xs font-semibold flex items-center gap-1.5 ${badgeStyles}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {daysLeft < 0
                      ? 'Expired'
                      : daysLeft === 0
                      ? 'Expires Today'
                      : `${daysLeft} days left`}
                  </div>

                  <button
                    onClick={() => {
                      if (onViewDoc) {
                        onViewDoc(item);
                      } else {
                        navigate(item.type === 'driver_license' ? '/drivers' : '/vehicles');
                      }
                    }}
                    className="text-xs font-medium text-navy-700 hover:text-navy-900 dark:text-navy-300 dark:hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
