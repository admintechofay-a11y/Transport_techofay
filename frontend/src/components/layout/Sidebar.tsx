import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileText,
  FileSignature,
  Route,
  Truck,
  UserCheck,
  FolderOpen,
  Building2,
  MapPin,
  Users,
  IndianRupee,
  Receipt,
  AlertCircle,
  ClipboardCheck,
  ShieldCheck,
  Camera,
  BarChart3,
  Settings,
  MessageCircle,
  FileCode,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboardMetrics } from '@/hooks/use-dashboard';
import { useTransportStore } from '@/stores/transport-data.store';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, company, logout } = useAuthStore();
  const { data: metrics } = useDashboardMetrics();
  const storeLoads = useTransportStore((s) => s.loads);
  const pendingPodsCount = storeLoads.filter((l) => l.pod_status !== 'verified').length;
  const navigate = useNavigate();
  const location = useLocation();

  const isItemActive = (to: string) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (to.includes('?')) {
      const [itemPath, itemQuery] = to.split('?');
      return currentPath === itemPath && currentSearch.includes(itemQuery);
    }

    if (currentPath === to) {
      if (to === '/freight' && (currentSearch.includes('tab=statements') || currentSearch.includes('tab=outstanding'))) {
        return false;
      }
      return true;
    }

    return false;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Public Website', to: '/home', icon: Shield },
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Loads', to: '/loads', icon: Package, badge: metrics?.today_loads ? `${metrics.today_loads} today` : undefined },
        { label: 'LR Numbers', to: '/lr-numbers', icon: FileText, badge: metrics?.pending_lrs ? `${metrics.pending_lrs}` : undefined },
        { label: 'Bilty / Consignment', to: '/bilties', icon: FileSignature },
      ],
    },
    {
      title: 'FLEET',
      items: [
        { label: 'Vehicles', to: '/vehicles', icon: Truck },
        { label: 'Drivers', to: '/drivers', icon: UserCheck },
        {
          label: 'Documents',
          to: '/documents',
          icon: FolderOpen,
          badge: (metrics?.expiring_documents || 0) > 0 ? `${metrics?.expiring_documents} alerts` : undefined,
          badgeAlert: true,
        },
      ],
    },
    {
      title: 'PARTIES',
      items: [
        { label: 'Customers', to: '/customers', icon: Building2 },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        { label: 'Freight Charges', to: '/freight', icon: IndianRupee },
        { label: 'Customer Statements', to: '/freight?tab=statements', icon: Receipt },
        {
          label: 'Outstanding',
          to: '/freight?tab=outstanding',
          icon: AlertCircle,
          badge: (metrics?.outstanding_balance || 0) > 0 ? 'Due' : undefined,
          badgeAlert: true,
        },
      ],
    },
    {
      title: 'DOCUMENTS',
      items: [
        { label: 'Delivery Challans', to: '/delivery-challans', icon: ClipboardCheck },
        { label: 'Gate Passes', to: '/gate-passes', icon: ShieldCheck },
        {
          label: 'POD Management',
          to: '/pod',
          icon: Camera,
          badge: pendingPodsCount > 0 ? `${pendingPodsCount}` : undefined,
          badgeAlert: true,
        },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { label: 'Reports', to: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        { label: 'WhatsApp API', to: '/settings/whatsapp', icon: MessageCircle, greenDot: true },
        { label: 'PDF Templates', to: '/settings/pdf-templates', icon: FileCode },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-[#0F2D56] text-white transition-all duration-300 ease-in-out border-r border-[#1A4080] select-none z-30',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#1A4080]/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-black/60 p-1 flex items-center justify-center border border-white/20 shadow-lg shrink-0">
            <img
              src="/techofay-logo.png"
              alt="Techofay"
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          {!sidebarCollapsed && (
            <div className="leading-tight">
              <span className="font-extrabold text-sm tracking-wide text-amber-300 block uppercase">TECHOFAY</span>
              <span className="text-[10px] font-semibold text-slate-300 tracking-wider block">Global Ventures • Fleet</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 relative">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!sidebarCollapsed && (
              <div className={cn('px-3 pb-1', gIdx > 0 && 'pt-3 border-t border-white/10')}>
                <h4 className="text-[9px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                  {group.title}
                </h4>
              </div>
            )}
            {group.items.map((item, iIdx) => {
              const active = isItemActive(item.to);
              return (
                <NavLink
                  key={iIdx}
                  to={item.to}
                  end={!item.to.includes('?')}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative',
                    active
                      ? 'bg-white/15 text-white font-bold shadow-xs before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-[#F97316] before:rounded-r'
                      : 'text-gray-300 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!sidebarCollapsed && item.greenDot && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20 animate-pulse" />
                  )}
                  {!sidebarCollapsed && item.badge && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                        item.badgeAlert ? 'bg-amber-500 text-white' : 'bg-white/20 text-white'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Subtle bottom scroll overlay */}
      <div className="absolute bottom-[61px] left-0 right-0 h-10 bg-gradient-to-t from-[#091D38] to-transparent pointer-events-none z-10" />

      {/* User Footer */}
      <div className="p-3 border-t border-[#1A4080]/60 bg-[#091D38]/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="leading-none overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-gray-400 mt-1 truncate">{company?.name || 'Techofay Fleet'}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
