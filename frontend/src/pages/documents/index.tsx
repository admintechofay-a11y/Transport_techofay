import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  Clock,
  Plus,
  Truck,
  User,
  FileText,
  Upload,
  ExternalLink,
  Printer,
  X,
  Share2,
  RefreshCw,
} from 'lucide-react';
import { useVehicles, useAddVehicleDocument } from '@/hooks/use-vehicles';
import { useDrivers, useAddDriverDocument } from '@/hooks/use-drivers';
import { vehicleApi } from '@/lib/api/vehicles.api';
import { driverApi } from '@/lib/api/drivers.api';
import { Vehicle } from '@/types/vehicle.types';
import { Driver } from '@/types/driver.types';
import { daysUntilExpiry, formatDate, getExpiryUrgency } from '@/lib/utils/date';
import { WhatsAppShareButton } from '@/components/shared/WhatsAppShareButton';
import { PdfPreviewDrawer } from '@/components/shared/PdfPreviewDrawer';
import { BTS_COMPANY_INFO } from '@/lib/pdf-downloader';
import { toast } from 'sonner';

export interface FleetComplianceDoc {
  id: string;
  targetId: string;
  targetType: 'vehicle' | 'driver';
  targetLabel: string;
  targetSub: string;
  docType: 'insurance' | 'fitness' | 'national_permit' | 'puc' | 'road_tax' | 'driver_license';
  docTypeName: string;
  docNumber: string;
  issuingAuthority: string;
  issuedDate?: string;
  expiryDate?: string;
  notes?: string;
}

export const DocumentsPage: React.FC = () => {
  const { data: serverVehicles } = useVehicles();
  const { data: serverDrivers } = useDrivers();
  const addVehicleDocMutation = useAddVehicleDocument();
  const addDriverDocMutation = useAddDriverDocument();

  const rawVehicles = Array.isArray(serverVehicles) ? serverVehicles : (serverVehicles as any)?.data;
  const vehicles: Vehicle[] = Array.isArray(rawVehicles) ? rawVehicles : [];

  const rawDrivers = Array.isArray(serverDrivers) ? serverDrivers : (serverDrivers as any)?.data;
  const drivers: Driver[] = Array.isArray(rawDrivers) ? rawDrivers : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'insurance' | 'fitness' | 'permit' | 'puc' | 'license'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'safe' | 'warning' | 'critical'>('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'vehicle' | 'driver'>('vehicle');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [formDocType, setFormDocType] = useState<'insurance' | 'fitness' | 'national_permit' | 'puc' | 'driver_license'>('insurance');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formAuthority, setFormAuthority] = useState('');
  const [formIssuedDate, setFormIssuedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // WhatsApp share
  const [whatsAppDoc, setWhatsAppDoc] = useState<FleetComplianceDoc | null>(null);

  // Compile compliance documents dynamically from live vehicles and drivers
  const documents: FleetComplianceDoc[] = useMemo(() => {
    const list: FleetComplianceDoc[] = [];

    vehicles.forEach((v) => {
      const plate = v.plate_number || 'TRUCK';
      const makeModel = `${v.make || 'Heavy Commercial'} ${v.model || 'Carrier'}`;

      // 1. Insurance
      if (v.insurance_expiry) {
        list.push({
          id: `doc_ins_${v.id || plate}`,
          targetId: String(v.id || plate),
          targetType: 'vehicle',
          targetLabel: plate,
          targetSub: makeModel,
          docType: 'insurance',
          docTypeName: 'Commercial Vehicle Insurance',
          docNumber: `POL-HDFC-${plate.replace(/[^A-Z0-9]/g, '')}`,
          issuingAuthority: 'HDFC ERGO General Insurance',
          expiryDate: v.insurance_expiry,
          notes: 'Comprehensive Goods Carrying Commercial Vehicle Package',
        });
      }

      // 2. Fitness Certificate
      if (v.fitness_expiry) {
        list.push({
          id: `doc_fit_${v.id || plate}`,
          targetId: String(v.id || plate),
          targetType: 'vehicle',
          targetLabel: plate,
          targetSub: makeModel,
          docType: 'fitness',
          docTypeName: 'Annual Fitness Certificate',
          docNumber: `FIT-RTO-${plate.replace(/[^A-Z0-9]/g, '')}`,
          issuingAuthority: 'Regional Transport Authority (RTO)',
          expiryDate: v.fitness_expiry,
          notes: 'Annual mandatory mechanical fitness & roadworthiness certificate',
        });
      }

      // 3. National Permit
      if (v.national_permit_expiry) {
        list.push({
          id: `doc_np_${v.id || plate}`,
          targetId: String(v.id || plate),
          targetType: 'vehicle',
          targetLabel: plate,
          targetSub: makeModel,
          docType: 'national_permit',
          docTypeName: 'All India National Permit (NP)',
          docNumber: `NP-MORTH-${plate.replace(/[^A-Z0-9]/g, '')}`,
          issuingAuthority: 'Ministry of Road Transport & Highways (MoRTH)',
          expiryDate: v.national_permit_expiry,
          notes: 'All India Interstate Goods Transport Authorization',
        });
      }

      // 4. PUC Certificate
      if (v.puc_expiry) {
        list.push({
          id: `doc_puc_${v.id || plate}`,
          targetId: String(v.id || plate),
          targetType: 'vehicle',
          targetLabel: plate,
          targetSub: makeModel,
          docType: 'puc',
          docTypeName: 'Pollution Under Control (PUC)',
          docNumber: `PUC-ENV-${plate.replace(/[^A-Z0-9]/g, '')}`,
          issuingAuthority: 'Authorised Pollution Emission Centre',
          expiryDate: v.puc_expiry,
          notes: 'BS-VI Heavy Haulage Smoke Density Test Clearance',
        });
      }
    });

    drivers.forEach((d) => {
      if (d.licence_expiry || d.driving_licence_number) {
        list.push({
          id: `doc_dl_${d.id || d.phone}`,
          targetId: String(d.id || d.phone),
          targetType: 'driver',
          targetLabel: d.name,
          targetSub: `Assigned: ${d.assigned_vehicle || 'Pool Driver'} • Ph: ${d.phone}`,
          docType: 'driver_license',
          docTypeName: 'Commercial Heavy Driver Licence (TRANS/HMV)',
          docNumber: d.driving_licence_number || `DL-${d.name.substring(0, 3).toUpperCase()}-9901`,
          issuingAuthority: 'Motor Licensing Transport Authority',
          expiryDate: d.licence_expiry,
          notes: 'Heavy Commercial Goods Vehicle (HMV / TRANS) Endorsement',
        });
      }
    });

    return list;
  }, [vehicles, drivers]);

  // Metrics
  const totalMonitored = documents.length;
  const expiredCount = documents.filter((d) => {
    const days = daysUntilExpiry(d.expiryDate);
    return days !== null && days <= 0;
  }).length;
  const warningCount = documents.filter((d) => {
    const days = daysUntilExpiry(d.expiryDate);
    return days !== null && days > 0 && days <= 30;
  }).length;
  const safeCount = documents.filter((d) => {
    const days = daysUntilExpiry(d.expiryDate);
    return days === null || days > 30;
  }).length;

  // Filtered List
  const filteredDocuments = documents.filter((d) => {
    // Search
    const matchesSearch =
      d.targetLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.targetSub.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.docTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Category
    if (categoryFilter === 'insurance' && d.docType !== 'insurance') return false;
    if (categoryFilter === 'fitness' && d.docType !== 'fitness') return false;
    if (categoryFilter === 'permit' && d.docType !== 'national_permit') return false;
    if (categoryFilter === 'puc' && d.docType !== 'puc') return false;
    if (categoryFilter === 'license' && d.docType !== 'driver_license') return false;

    // Urgency
    const days = daysUntilExpiry(d.expiryDate);
    const urgency = getExpiryUrgency(days);
    if (urgencyFilter === 'critical' && urgency !== 'critical') return false;
    if (urgencyFilter === 'warning' && urgency !== 'warning') return false;
    if (urgencyFilter === 'safe' && urgency !== 'safe' && urgency !== 'unknown') return false;

    return true;
  });

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error('Please select a vehicle or driver');
      return;
    }
    if (!formExpiryDate) {
      toast.error('Please choose document expiry date');
      return;
    }

    try {
      if (targetType === 'vehicle') {
        await addVehicleDocMutation.mutateAsync({
          vehicle_uuid: selectedAssetId,
          document_type: formDocType === 'fitness' ? 'fitness_certificate' : formDocType,
          document_number: formDocNumber || undefined,
          issuing_authority: formAuthority || undefined,
          expiry_date: formExpiryDate,
          notes: formNotes || undefined,
        });
      } else {
        await addDriverDocMutation.mutateAsync({
          driver_uuid: selectedAssetId,
          document_type: formDocType === 'driver_license' ? 'driving_licence' : formDocType,
          document_number: formDocNumber || undefined,
          issuing_authority: formAuthority || undefined,
          expiry_date: formExpiryDate,
          notes: formNotes || undefined,
        });
      }

      setIsAddModalOpen(false);
      setFormDocNumber('');
      setFormAuthority('');
      setFormExpiryDate('');
      setFormNotes('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to register document on server');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Fleet Documents & Compliance Vault
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-navy-100 dark:bg-navy-950 text-navy-800 dark:text-navy-300">
              {totalMonitored} Monitored
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time compliance monitoring for Commercial Insurance, Fitness Certificates, National Permits, PUC, and Driver Licences
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-saffron-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            Renew / Add Document
          </button>
        </div>
      </div>

      {/* 4 Compliance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Documents
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalMonitored}</span>
            <span className="text-xs text-slate-500">active statutory records</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Valid & Compliant
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{safeCount}</span>
            <span className="text-xs text-emerald-600/80 font-medium">Safe to dispatch</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Expiring Soon (&lt; 30d)
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{warningCount}</span>
            <span className="text-xs text-amber-600/80 font-medium">Renewal in progress</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Expired / Urgent
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{expiredCount}</span>
            <span className="text-xs text-rose-600/80 font-medium">Trip halt risk</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Plate, Driver, Policy #, Insurer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-saffron-500"
              />
            </div>

            {/* Urgency Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
              <button
                type="button"
                onClick={() => setUrgencyFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  urgencyFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                All ({totalMonitored})
              </button>
              <button
                type="button"
                onClick={() => setUrgencyFilter('critical')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  urgencyFilter === 'critical'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                }`}
              >
                Expired ({expiredCount})
              </button>
              <button
                type="button"
                onClick={() => setUrgencyFilter('warning')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  urgencyFilter === 'warning'
                    ? 'bg-amber-500 text-white'
                    : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
              >
                Expiring Soon ({warningCount})
              </button>
              <button
                type="button"
                onClick={() => setUrgencyFilter('safe')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  urgencyFilter === 'safe'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
              >
                Compliant ({safeCount})
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-200 dark:border-slate-800 text-xs">
            {[
              { id: 'all', label: 'All Document Categories' },
              { id: 'insurance', label: 'Commercial Insurance' },
              { id: 'fitness', label: 'Fitness Certificates' },
              { id: 'permit', label: 'National Permits' },
              { id: 'puc', label: 'Pollution (PUC)' },
              { id: 'license', label: 'Driver Commercial Licences' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  categoryFilter === tab.id
                    ? 'bg-saffron-500/15 text-saffron-700 dark:text-saffron-300 border border-saffron-500/30 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Asset / Target</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Policy / Document #</th>
                <th className="py-3 px-4">Issuing Authority</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-center">Validity Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <FolderOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No compliance documents registered yet
                      </p>
                      <p className="text-xs text-slate-500">
                        When you register vehicles or drivers, their insurance, fitness, national permit, and commercial licences will be tracked here.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add First Document
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const days = daysUntilExpiry(doc.expiryDate);
                  const urgency = getExpiryUrgency(days);

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Asset Target */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${doc.targetType === 'vehicle' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'}`}>
                            {doc.targetType === 'vehicle' ? <Truck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white font-mono">
                              {doc.targetLabel}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {doc.targetSub}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Document Type */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {doc.docTypeName}
                        </span>
                        {doc.notes && (
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            {doc.notes}
                          </span>
                        )}
                      </td>

                      {/* Document Number */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {doc.docNumber}
                      </td>

                      {/* Issuing Authority */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {doc.issuingAuthority}
                      </td>

                      {/* Expiry Date & Countdown */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold block text-slate-900 dark:text-white">
                          {formatDate(doc.expiryDate)}
                        </span>
                        <span className={`text-[11px] font-bold block ${
                          urgency === 'critical'
                            ? 'text-rose-600'
                            : urgency === 'warning'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}>
                          {days !== null ? (
                            days <= 0 ? (
                              `Expired ${Math.abs(days)} days ago`
                            ) : (
                              `${days} days remaining`
                            )
                          ) : (
                            'Open validity'
                          )}
                        </span>
                      </td>

                      {/* Validity Status */}
                      <td className="py-3.5 px-4 text-center">
                        {urgency === 'critical' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            <AlertCircle className="w-3 h-3" />
                            EXPIRED
                          </span>
                        ) : urgency === 'warning' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                            <AlertTriangle className="w-3 h-3" />
                            Expiring Soon
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 className="w-3 h-3" />
                            Valid
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssetId(doc.targetId);
                              setTargetType(doc.targetType);
                              setFormDocType(doc.docType as any);
                              setFormDocNumber(doc.docNumber);
                              setFormAuthority(doc.issuingAuthority);
                              setFormExpiryDate(doc.expiryDate || '');
                              setIsAddModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
                            title="Renew or Update Expiry"
                          >
                            Renew
                          </button>

                          <button
                            type="button"
                            onClick={() => setWhatsAppDoc(doc)}
                            className="p-1.5 rounded border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
                            title="Send WhatsApp Renewal Alert"
                          >
                            <Share2 className="w-3.5 h-3.5" />
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

      {/* Add / Renew Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-saffron-500" />
                Register / Renew Fleet Document
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="p-6 space-y-4 text-xs">
              {/* Target Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('vehicle');
                    setSelectedAssetId(vehicles[0]?.uuid || vehicles[0]?.plate_number || '');
                    setFormDocType('insurance');
                  }}
                  className={`p-2.5 rounded-lg border text-center font-bold flex items-center justify-center gap-2 ${
                    targetType === 'vehicle'
                      ? 'border-saffron-500 bg-saffron-500/10 text-saffron-700 dark:text-saffron-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Vehicle Asset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('driver');
                    setSelectedAssetId(drivers[0]?.uuid || String(drivers[0]?.id || ''));
                    setFormDocType('driver_license');
                  }}
                  className={`p-2.5 rounded-lg border text-center font-bold flex items-center justify-center gap-2 ${
                    targetType === 'driver'
                      ? 'border-saffron-500 bg-saffron-500/10 text-saffron-700 dark:text-saffron-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Driver Licence
                </button>
              </div>

              {/* Select Asset */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {targetType === 'vehicle' ? 'Select Fleet Vehicle *' : 'Select Driver *'}
                </label>
                {targetType === 'vehicle' ? (
                  <select
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Truck Plate --</option>
                    {vehicles.map((v) => (
                      <option key={v.uuid || v.id || v.plate_number} value={v.uuid || String(v.id || v.plate_number)}>
                        {v.plate_number} ({v.make || 'Truck'} - {v.capacity_tonnage || 25}T)
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.uuid || d.id || d.phone} value={d.uuid || String(d.id || d.phone)}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Document Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Document Category *
                  </label>
                  <select
                    value={formDocType}
                    onChange={(e) => setFormDocType(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  >
                    {targetType === 'vehicle' ? (
                      <>
                        <option value="insurance">Commercial Vehicle Insurance</option>
                        <option value="fitness">Annual Fitness Certificate</option>
                        <option value="national_permit">National Goods Permit (NP)</option>
                        <option value="puc">Pollution Under Control (PUC)</option>
                      </>
                    ) : (
                      <option value="driver_license">Commercial Heavy Licence (HMV)</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Policy / Certificate #
                  </label>
                  <input
                    type="text"
                    value={formDocNumber}
                    onChange={(e) => setFormDocNumber(e.target.value)}
                    placeholder="e.g. POL-9920112"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Authority & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issuing Authority / Insurer
                  </label>
                  <input
                    type="text"
                    value={formAuthority}
                    onChange={(e) => setFormAuthority(e.target.value)}
                    placeholder="e.g. HDFC ERGO / RTO Vadodara"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Endorsement Notes / Coverage Details
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Comprehensive commercial haulage insurance policy"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-slate-950 font-bold transition-all shadow-md shadow-saffron-500/20 active:scale-95"
                >
                  Save & Update Expiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share Reminder Drawer */}
      {whatsAppDoc && (
        <WhatsAppShareButton
          documentType="lr"
          documentNumber={whatsAppDoc.docNumber}
          recipientName={whatsAppDoc.targetLabel}
          recipientPhone="+919876543210"
          defaultMessage={`Compliance Alert from TECHOFAY GLOBAL VENTURES: The ${whatsAppDoc.docTypeName} for ${whatsAppDoc.targetLabel} (${whatsAppDoc.docNumber}) is due for renewal on ${formatDate(whatsAppDoc.expiryDate)}. Please submit renewed documents promptly to prevent road haulage dispatch halts.`}
        />
      )}
    </div>
  );
};
