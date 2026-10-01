import React, { useState } from 'react';
import {
  Truck,
  Plus,
  LayoutList,
  Kanban,
  Download,
  Share2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { useLoads } from '@/hooks/use-loads';
import { Load } from '@/types/load.types';
import { LoadTable } from '@/components/loads/LoadTable';
import { LoadKanban } from '@/components/loads/LoadKanban';
import { LoadDetailDrawer } from '@/components/loads/LoadDetailDrawer';
import { LoadFormModal } from '@/components/loads/LoadFormModal';
import { WhatsAppShareButton } from '@/components/shared/WhatsAppShareButton';
import { HeroAdmissionBanner } from '@/components/shared/HeroAdmissionBanner';
import { toast } from 'sonner';

// Real registered loads only
const defaultDemoLoads: Load[] = [];


export const LoadsPage: React.FC = () => {
  const { data: serverLoads, isLoading, refetch } = useLoads();
  const rawList = Array.isArray(serverLoads) ? serverLoads : (serverLoads as any)?.data;
  const loads: Load[] = Array.isArray(rawList) ? rawList : [];

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [whatsAppLoad, setWhatsAppLoad] = useState<Load | null>(null);

  const handleCreateSuccess = () => {
    refetch();
    toast.success('Consignment load booked successfully!');
  };

  return (
    <div className="space-y-5">
      {/* Official Intake & Consignment Admission Hero Section */}
      <HeroAdmissionBanner onLoadCreated={() => refetch()} />

      {/* Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Consignment & Load Management
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-100 dark:bg-navy-900/60 text-navy-800 dark:text-navy-200">
              {loads.length} Loads
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage FTL, PTL, multi-stop corridor trips, e-Way bills, and vehicle dispatches
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1 shadow-2xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                viewMode === 'table'
                  ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden md:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                viewMode === 'kanban'
                  ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden md:inline">Kanban</span>
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-saffron-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            Book Consignment
          </button>
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {viewMode === 'table' ? (
        <LoadTable
          loads={loads}
          onSelectLoad={(l) => setSelectedLoad(l)}
          onGenerateLr={(l) => {
            toast.info(`Generating LR for load ${l.load_number || l.id}...`);
            setSelectedLoad(l);
          }}
          onShareWhatsApp={(l) => setWhatsAppLoad(l)}
        />
      ) : (
        <LoadKanban
          loads={loads}
          onSelectLoad={(l) => setSelectedLoad(l)}
          onGenerateLr={(l) => {
            toast.info(`Generating LR for load ${l.load_number || l.id}...`);
            setSelectedLoad(l);
          }}
          onShareWhatsApp={(l) => setWhatsAppLoad(l)}
        />
      )}

      {/* Slide-over Detail Drawer */}
      <LoadDetailDrawer
        load={selectedLoad}
        isOpen={Boolean(selectedLoad)}
        onClose={() => setSelectedLoad(null)}
        onGenerateLr={(l) => toast.success(`LR sequence generated for ${l.load_number}!`)}
        onCreateBilty={(l) => toast.success(`Bilty created for ${l.load_number}!`)}
      />

      {/* 7-Section Load Booking Modal */}
      <LoadFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitSuccess={handleCreateSuccess}
      />

      {/* WhatsApp Share Drawer */}
      {whatsAppLoad && (
        <WhatsAppShareButton
          documentType="load"
          documentNumber={String(whatsAppLoad.load_number || whatsAppLoad.id || '')}
          recipientName={whatsAppLoad.consignor?.name || 'Customer'}
          recipientPhone={whatsAppLoad.consignor?.phone || '+919876543210'}
          defaultMessage={`Hello ${whatsAppLoad.consignor?.name || 'Valued Customer'}, your consignment ${whatsAppLoad.load_number} from ${whatsAppLoad.origin_location?.name || ''} to ${whatsAppLoad.destination_location?.name || ''} is ${(whatsAppLoad.status || '').toUpperCase()}. Assigned Truck: ${whatsAppLoad.vehicle?.plate_number || ''}. Live tracking: https://track.techofay.com/track/${whatsAppLoad.id}`}
        />
      )}
    </div>
  );
};
