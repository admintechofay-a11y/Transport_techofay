import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Moon,
  Sun,
  AlertTriangle,
  ChevronRight,
  Camera,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboardMetrics } from '@/hooks/use-dashboard';
import { useTransportStore } from '@/stores/transport-data.store';

export const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setGlobalSearchOpen, notificationsOpen, setNotificationsOpen, darkMode, toggleDarkMode } = useUIStore();
  const { company } = useAuthStore();
  const { data: metrics } = useDashboardMetrics();
  const vehicles = useTransportStore((s) => s.vehicles);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click-outside listener for notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen, setNotificationsOpen]);

  // Determine page title from path
  const getPageTitle = (pathname: string): { title: string; subtitle?: string } => {
    if (pathname.startsWith('/loads')) return { title: 'Load Operations', subtitle: 'Manage active transport consignments & dispatches' };
    if (pathname.startsWith('/lr-numbers')) return { title: 'Lorry Receipts (LR)', subtitle: 'Statutory road haulage consignment notes' };
    if (pathname.startsWith('/bilties')) return { title: 'Bilty Notes', subtitle: 'Transport freight acknowledgments & payment terms' };
    if (pathname.startsWith('/vehicles')) return { title: 'Vehicle Fleet', subtitle: 'HCV, LCV, Trailers & fleet allocation' };
    if (pathname.startsWith('/drivers')) return { title: 'Commercial Drivers', subtitle: 'Driver roster, license renewals & trip logs' };
    if (pathname.startsWith('/documents')) return { title: 'Fleet Documents & Compliance', subtitle: 'National permits, fitness, commercial insurance, PUC & driver licenses' };
    if (pathname.startsWith('/customers')) return { title: 'Customer & Party Directory', subtitle: 'Consignors, consignees, GSTIN accounts & ledger statements' };
    if (pathname.startsWith('/freight')) return { title: 'Freight & Charges', subtitle: 'Financial ledger, advance settlements & customer statements' };
    if (pathname.startsWith('/delivery-challans')) return { title: 'Delivery Challans', subtitle: 'Material acknowledgment slips' };
    if (pathname.startsWith('/gate-passes')) return { title: 'Security Gate Passes', subtitle: 'Facility IN/OUT verification' };
    if (pathname.startsWith('/pod')) return { title: 'Proof of Delivery (POD) Management', subtitle: 'Stamped delivery acknowledgment receipts, digital verification & freight clearance' };
    if (pathname.startsWith('/reports')) return { title: 'Analytics & Reports', subtitle: 'Transport operational audits, utilization & exports' };
    if (pathname.startsWith('/settings/whatsapp')) return { title: 'WhatsApp Business API', subtitle: 'Automated status triggers & dispatch settings' };
    if (pathname.startsWith('/settings/pdf-templates')) return { title: 'PDF Print Templates', subtitle: 'Custom company branding, GSTIN & legal carriage terms' };
    return { title: 'Transport Operations Control', subtitle: 'Live logistics monitoring & overview' };
  };

  const { title, subtitle } = getPageTitle(location.pathname);
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  // Metrics fallback from store
  const expiringDocsCount = metrics?.expiring_documents || vehicles.filter((v) => v.insurance_expiry && new Date(v.insurance_expiry) < new Date(Date.now() + 60 * 86400000)).length || 0;
  const pendingPodsCount = metrics?.pending_pods || 2;
  const outstandingBal = metrics?.outstanding_balance || 145000;
  const totalAlerts = (expiringDocsCount > 0 ? 1 : 0) + (pendingPodsCount > 0 ? 1 : 0) + (outstandingBal > 0 ? 1 : 0);

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{title}</h1>
        {!isDashboard ? (
          <nav className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Link to="/dashboard" className="hover:text-saffron-500 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[200px]">
              {title}
            </span>
          </nav>
        ) : subtitle ? (
          <p className="text-[11px] text-gray-500 dark:text-slate-400 hidden sm:block">{subtitle}</p>
        ) : null}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Global Search Button */}
        <button
          type="button"
          onClick={() => setGlobalSearchOpen(true)}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 text-xs transition shadow-sm"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-gray-500 dark:text-slate-400">Quick search...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-[10px] font-mono text-gray-500 dark:text-slate-400 font-semibold shadow-xs">
            ⌘K
          </kbd>
        </button>

        {/* Company Badge Chip (Prompt 6: compact TGV circle badge) */}
        <div
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-[#0F2D56] text-amber-300 font-black text-xs shadow-sm ring-1 ring-white/20 select-none"
          title="TECHOFAY GLOBAL VENTURES"
        >
          TGV
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* Quick Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  Compliance & Alerts
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                  {totalAlerts} Attention
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                {expiringDocsCount > 0 && (
                  <div
                    onClick={() => {
                      navigate('/documents');
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span><strong>{expiringDocsCount}</strong> documents expiring soon</span>
                    </div>
                    <span className="text-[10px] text-amber-600/80 dark:text-amber-400 whitespace-nowrap ml-2">Just now</span>
                  </div>
                )}

                {pendingPodsCount > 0 && (
                  <div
                    onClick={() => {
                      navigate('/pod');
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800/60 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                      <span><strong>{pendingPodsCount}</strong> PODs pending verification</span>
                    </div>
                    <span className="text-[10px] text-blue-600/80 dark:text-blue-400 whitespace-nowrap ml-2">Just now</span>
                  </div>
                )}

                {outstandingBal > 0 && (
                  <div
                    onClick={() => {
                      navigate('/freight?tab=outstanding');
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-950/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Outstanding balance due</span>
                    </div>
                    <span className="text-[10px] text-rose-600/80 dark:text-rose-400 whitespace-nowrap ml-2">Just now</span>
                  </div>
                )}

                {totalAlerts === 0 && (
                  <p className="text-center py-4 text-gray-400 dark:text-slate-500 text-xs">
                    All fleet documents, licenses & PODs are up to date.
                  </p>
                )}
              </div>

              {/* Footer link */}
              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800 text-center">
                <Link
                  to="/reports"
                  onClick={() => setNotificationsOpen(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-saffron-600 hover:text-saffron-700 transition"
                >
                  <span>View all alerts</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
