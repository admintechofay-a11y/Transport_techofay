import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Truck,
  Users,
  IndianRupee,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { formatINR } from '@/lib/utils/currency';
import { formatDate, daysUntilExpiry } from '@/lib/utils/date';
import { downloadCsv } from '@/lib/pdf-downloader';
import { toast } from 'sonner';
import { useLoads } from '@/hooks/use-loads';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';

type ReportType =
  | 'loads_summary'
  | 'vehicle_utilization'
  | 'driver_performance'
  | 'freight_ledger'
  | 'compliance_expiries';

export const ReportsPage: React.FC = () => {
  const { data: serverLoads } = useLoads();
  const { data: serverVehicles } = useVehicles();
  const { data: serverDrivers } = useDrivers();

  const loads = Array.isArray(serverLoads) ? serverLoads : ((serverLoads as any)?.data || []);
  const vehicles = Array.isArray(serverVehicles) ? serverVehicles : ((serverVehicles as any)?.vehicles || (serverVehicles as any)?.data || []);
  const drivers = Array.isArray(serverDrivers) ? serverDrivers : ((serverDrivers as any)?.drivers || (serverDrivers as any)?.data || []);

  const [reportType, setReportType] = useState<ReportType>('loads_summary');
  const [dateRange, setDateRange] = useState('month_to_date');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const reportDefinitions = [
    {
      id: 'loads_summary',
      title: 'Consignment & Loads Summary',
      description: 'Total trips, tonnage moved, corridor volume, and delivery SLA performance',
      icon: Truck,
    },
    {
      id: 'vehicle_utilization',
      title: 'Vehicle Fleet Utilization & Odometer',
      description: 'Trip sheets, active hours vs idle time, and fleet efficiency metrics',
      icon: Truck,
    },
    {
      id: 'driver_performance',
      title: 'Driver Duty & Trip Records',
      description: 'Duty hours, trips completed, and incident-free performance logs',
      icon: Users,
    },
    {
      id: 'freight_ledger',
      title: 'GST Freight Revenue & Ledger',
      description: 'Itemized freight earnings, advances, detention, and customer balances',
      icon: IndianRupee,
    },
    {
      id: 'compliance_expiries',
      title: 'Regulatory & Document Expiry Compliance',
      description: 'Audit report of National Permits, Fitness, Insurance, and DL renewals due',
      icon: AlertTriangle,
    },
  ];

  const handleExportExcel = () => {
    setIsExporting(true);
    let rows: (string | number)[][] = [];

    if (reportType === 'freight_ledger') {
      rows.push(['Date', 'Load ID', 'Customer', 'Origin', 'Destination', 'Freight (INR)', 'Advance (INR)', 'Balance (INR)', 'Status']);
      if (loads.length === 0) {
        rows.push(['No loads recorded yet', '', '', '', '', '', '', '', '']);
      } else {
        loads.forEach((l) => {
          rows.push([
            formatDate(l.created_at || new Date().toISOString()),
            l.load_number || l.id,
            l.consignor?.name || 'Customer',
            l.origin_location?.name || 'Origin',
            l.destination_location?.name || 'Destination',
            l.total_freight || 0,
            l.advance_amount || 0,
            (l.total_freight || 0) - (l.advance_amount || 0),
            (l.status || 'pending').toUpperCase(),
          ]);
        });
      }
    } else if (reportType === 'vehicle_utilization') {
      rows.push(['Vehicle Plate', 'Make & Model', 'Capacity (MT)', 'Body Type', 'Assigned Driver', 'Active Status']);
      if (vehicles.length === 0) {
        rows.push(['No vehicles registered yet', '', '', '', '', '']);
      } else {
        vehicles.forEach((v) => {
          rows.push([
            v.plate_number,
            `${v.make || ''} ${v.model || ''}`.trim(),
            v.capacity_tonnage || v.capacity_tonnes || 25,
            v.vehicle_type || 'Closed Container',
            v.driver_name || 'Unassigned',
            (v.status || 'available').toUpperCase(),
          ]);
        });
      }
    } else if (reportType === 'driver_performance') {
      rows.push(['Driver Name', 'Phone', 'License Number', 'Licence Expiry', 'Assigned Vehicle', 'Status']);
      if (drivers.length === 0) {
        rows.push(['No drivers registered yet', '', '', '', '', '']);
      } else {
        drivers.forEach((d) => {
          rows.push([
            d.name,
            d.phone,
            d.driving_licence_number || d.drivers_license_number || 'N/A',
            d.licence_expiry || 'Valid',
            d.assigned_vehicle || 'Unassigned',
            (d.status || 'available').toUpperCase(),
          ]);
        });
      }
    } else if (reportType === 'compliance_expiries') {
      rows.push(['Entity / Asset', 'Compliance Document', 'Expiry Date', 'Days Remaining', 'Status']);
      const expiryRows: (string | number)[][] = [];
      vehicles.forEach((v) => {
        if (v.insurance_expiry) {
          const days = daysUntilExpiry(v.insurance_expiry);
          if (days <= 30) {
            expiryRows.push([v.plate_number, 'Vehicle Insurance', v.insurance_expiry, days, days < 7 ? 'CRITICAL' : 'WARNING']);
          }
        }
        if (v.fitness_expiry) {
          const days = daysUntilExpiry(v.fitness_expiry);
          if (days <= 30) {
            expiryRows.push([v.plate_number, 'Fitness Certificate', v.fitness_expiry, days, days < 7 ? 'CRITICAL' : 'WARNING']);
          }
        }
      });
      drivers.forEach((d) => {
        const exp = d.licence_expiry || d.drivers_license_expiry;
        if (exp) {
          const days = daysUntilExpiry(exp);
          if (days <= 30) {
            expiryRows.push([d.name, 'Driving Licence', exp, days, days < 7 ? 'CRITICAL' : 'WARNING']);
          }
        }
      });
      if (expiryRows.length === 0) {
        rows.push(['All compliance documents valid', 'N/A', 'N/A', 'N/A', 'COMPLIANT']);
      } else {
        rows.push(...expiryRows);
      }
    } else {
      // loads_summary
      rows.push(['Load ID', 'Consignor', 'Origin', 'Destination', 'Vehicle Plate', 'Driver', 'Freight (INR)', 'Status']);
      if (loads.length === 0) {
        rows.push(['No loads recorded yet', '', '', '', '', '', '', '']);
      } else {
        loads.forEach((l) => {
          rows.push([
            l.load_number || l.id,
            l.consignor?.name || 'Customer',
            l.origin_location?.name || 'Origin',
            l.destination_location?.name || 'Destination',
            l.vehicle?.plate_number || 'TBD',
            l.driver?.name || 'Driver',
            l.total_freight || 0,
            (l.status || 'pending').toUpperCase(),
          ]);
        });
      }
    }

    setTimeout(() => {
      setIsExporting(false);
      downloadCsv(`Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    }, 300);
  };

  const handleExportPdf = () => {
    toast.success('Generating formatted PDF report...');
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Operations & Regulatory Reports
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-navy-100 dark:bg-navy-950/60 text-navy-800 dark:text-navy-300">
              Transport Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate and export compliance, trip utilization, and billing statements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-4 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-saffron-500/20 active:scale-95 transition"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export Excel (.xlsx)'}
          </button>
        </div>
      </div>

      {/* Report Type Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {reportDefinitions.map((rep) => {
          const Icon = rep.icon;
          const isSelected = reportType === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setReportType(rep.id as ReportType)}
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'border-saffron-500 bg-saffron-50/50 dark:bg-saffron-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2.5 ${
                    isSelected
                      ? 'bg-saffron-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {rep.title}
                </h4>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                {rep.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Date Range:
          </span>
          {['today', 'last_7_days', 'month_to_date', 'last_quarter', 'custom'].map((d) => (
            <button
              key={d}
              onClick={() => setDateRange(d)}
              className={`px-2.5 py-1 rounded-md capitalize transition ${
                dateRange === d
                  ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {d.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search within report..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Dynamic Report Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {reportType.replace(/_/g, ' ')} Report
            </h3>
            <p className="text-[11px] text-slate-400">
              Period: {dateRange.replace(/_/g, ' ')} • Generated {formatDate(new Date().toISOString())}
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
            Live Preview
          </span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'loads_summary' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Load ID</th>
                  <th className="py-3 px-4">Corridor Route</th>
                  <th className="py-3 px-4">Consignor</th>
                  <th className="py-3 px-4">Truck & Driver</th>
                  <th className="py-3 px-4 text-right">Freight (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No registered consignment loads found. Admitted loads will appear here in real-time.
                    </td>
                  </tr>
                ) : (
                  loads.map((l) => (
                    <tr key={l.id || l.load_number} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-navy-900 dark:text-navy-200">
                        {l.load_number || l.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {l.origin_location?.name || 'Origin'} → {l.destination_location?.name || 'Destination'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {l.consignor?.name || 'Customer'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {l.vehicle?.plate_number || 'TBD'}
                        </div>
                        <div className="text-[11px] text-slate-400">{l.driver?.name || 'Driver'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatINR(Number(l.total_freight) || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {l.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'compliance_expiries' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Entity / Asset</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Days Remaining</th>
                  <th className="py-3 px-4 text-right">Compliance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(() => {
                  const expiringItems: any[] = [];
                  vehicles.forEach((v) => {
                    if (v.insurance_expiry) {
                      const days = daysUntilExpiry(v.insurance_expiry);
                      if (days <= 30) {
                        expiringItems.push({
                          title: v.plate_number,
                          docType: 'Insurance Policy',
                          date: v.insurance_expiry,
                          days,
                          action: 'Renew Insurance',
                        });
                      }
                    }
                    if (v.fitness_expiry) {
                      const days = daysUntilExpiry(v.fitness_expiry);
                      if (days <= 30) {
                        expiringItems.push({
                          title: v.plate_number,
                          docType: 'Fitness Certificate',
                          date: v.fitness_expiry,
                          days,
                          action: 'RTO Vehicle Inspection',
                        });
                      }
                    }
                  });
                  drivers.forEach((d) => {
                    const exp = d.licence_expiry || d.drivers_license_expiry;
                    if (exp) {
                      const days = daysUntilExpiry(exp);
                      if (days <= 30) {
                        expiringItems.push({
                          title: d.name,
                          docType: 'Driving Licence',
                          date: exp,
                          days,
                          action: 'Medical & DL Renewal',
                        });
                      }
                    }
                  });

                  if (expiringItems.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          All registered vehicles and driver licenses are currently compliant. No renewals due within 30 days.
                        </td>
                      </tr>
                    );
                  }

                  return expiringItems.map((item, idx) => (
                    <tr key={idx} className={item.days < 7 ? 'bg-red-50/30 dark:bg-red-950/20' : ''}>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{item.title}</td>
                      <td className="py-3 px-4">{item.docType}</td>
                      <td className="py-3 px-4 font-mono">{formatDate(item.date)}</td>
                      <td className={`py-3 px-4 font-mono font-bold ${item.days < 7 ? 'text-red-600' : 'text-amber-600'}`}>
                        {item.days < 0 ? 'Expired' : `${item.days} Days Left`}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-saffron-600">{item.action}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          )}

          {reportType === 'vehicle_utilization' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Make & Model</th>
                  <th className="py-3 px-4">Capacity (MT)</th>
                  <th className="py-3 px-4">Assigned Driver</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No vehicles registered in fleet yet.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id || v.plate_number}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{v.plate_number}</td>
                      <td className="py-3 px-4">{v.make} {v.model}</td>
                      <td className="py-3 px-4 font-mono">{v.capacity_tonnage || v.capacity_tonnes || 25} MT</td>
                      <td className="py-3 px-4">{v.driver_name || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-right uppercase font-bold text-emerald-600">{v.status || 'Available'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'driver_performance' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">Mobile Phone</th>
                  <th className="py-3 px-4">Driving Licence</th>
                  <th className="py-3 px-4">Assigned Vehicle</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No drivers registered in crew roster yet.
                    </td>
                  </tr>
                ) : (
                  drivers.map((d) => (
                    <tr key={d.id || d.name}>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{d.name}</td>
                      <td className="py-3 px-4 font-mono">{d.phone}</td>
                      <td className="py-3 px-4 font-mono uppercase">{d.driving_licence_number || d.drivers_license_number || 'Tracked'}</td>
                      <td className="py-3 px-4 font-mono">{d.assigned_vehicle || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-right uppercase font-bold text-emerald-600">{d.status || 'Available'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'freight_ledger' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Consignment</th>
                  <th className="py-3 px-4">Consignor</th>
                  <th className="py-3 px-4 text-right">Total Freight</th>
                  <th className="py-3 px-4 text-right">Advance Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No freight revenue records found.
                    </td>
                  </tr>
                ) : (
                  loads.map((l) => (
                    <tr key={l.id || l.load_number}>
                      <td className="py-3 px-4 font-mono">{formatDate(l.created_at || new Date().toISOString())}</td>
                      <td className="py-3 px-4 font-mono font-bold text-navy-900 dark:text-navy-200">{l.load_number || l.id}</td>
                      <td className="py-3 px-4 font-medium">{l.consignor?.name || 'Customer'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{formatINR(Number(l.total_freight) || 0)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">{formatINR(Number(l.advance_amount) || 0)}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-600 font-bold">{formatINR((Number(l.total_freight) || 0) - (Number(l.advance_amount) || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
