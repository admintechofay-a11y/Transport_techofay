import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Truck,
  FileText,
  CheckCircle2,
  Receipt,
  User,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  downloadLoadingSlipPdf,
  downloadTripMemoPdf,
  downloadBiltyPdf,
  BTS_COMPANY_INFO,
} from '@/lib/pdf-downloader';
import { useCreateLoad } from '@/hooks/use-loads';

interface QuickAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (loadData: any) => void;
}

export const QuickAdmissionModal: React.FC<QuickAdmissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const createLoadMutation = useCreateLoad();
  const currentYear = new Date().getFullYear();
  const randomSeq = Math.floor(1000 + Math.random() * 9000);

  // Form State
  const [slipNo, setSlipNo] = useState(`TGV-${currentYear}-${randomSeq}`);
  const [memoNo, setMemoNo] = useState(`MEMO-${currentYear}-${randomSeq}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderSource, setOrderSource] = useState('Phone');

  // Party / Consignor
  const [toName, setToName] = useState('');
  const [station, setStation] = useState('');
  const [origin, setOrigin] = useState('');

  // Consignee
  const [consigneeName, setConsigneeName] = useState('');

  // Vehicle, Driver, Owner
  const [truckNo, setTruckNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');

  // Cargo & Rates
  const [weight, setWeight] = useState('');
  const [goodsDesc, setGoodsDesc] = useState('');
  const [rate, setRate] = useState('');
  const [detentionPerDay, setDetentionPerDay] = useState('1500');

  // Financials
  const [freight, setFreight] = useState('');
  const [advance, setAdvance] = useState('');
  const [toPay, setToPay] = useState('To be billed');

  // Operational Deductions
  const [commission, setCommission] = useState('0');
  const [tapal, setTapal] = useState('0');
  const [guide, setGuide] = useState('0');
  const [craneGodown, setCraneGodown] = useState('0');
  const [incomingHamali, setIncomingHamali] = useState('0');
  const [handLoan, setHandLoan] = useState('0');
  const [memoHandLoan, setMemoHandLoan] = useState('0');
  const [diesel, setDiesel] = useState('0');
  const [localExp, setLocalExp] = useState('0');
  const [hamali, setHamali] = useState('0');

  if (!isOpen) return null;

  const numFreight = Number(freight) || 0;
  const numAdvance = Number(advance) || 0;
  const balance = numFreight - numAdvance;

  const totalDeductions =
    Number(commission) +
    Number(tapal) +
    Number(guide) +
    Number(craneGodown) +
    Number(incomingHamali) +
    Number(handLoan) +
    Number(memoHandLoan) +
    Number(diesel);

  const handleDownloadLoadingSlip = () => {
    downloadLoadingSlipPdf({
      slipNo,
      date,
      toName,
      orderSource,
      truckNo,
      station,
      weight,
      rate,
      advance: numAdvance,
      balance,
      toPay,
      detentionPerDay,
    });
  };

  const handleDownloadTripMemo = () => {
    downloadTripMemoPdf({
      memoNo,
      date,
      from: origin,
      to: station,
      truckNo,
      driverName,
      driverPhone,
      ownerName,
      ownerAddress,
      transporterName: toName,
      freight: numFreight,
      advance: numAdvance,
      balance,
      toPay: balance,
      localExpense: Number(localExp),
      hamali: Number(hamali),
      commission: Number(commission),
      tapal: Number(tapal),
      guide: Number(guide),
      craneGodown: Number(craneGodown),
      incomingHamali: Number(incomingHamali),
      handLoan: Number(handLoan),
      memoHandLoan: Number(memoHandLoan),
      diesel: Number(diesel),
    });
  };

  const handleDownloadBilty = () => {
    downloadBiltyPdf({
      biltyNumber: `BL-${slipNo.replace(/[^0-9]/g, '')}`,
      date,
      consignorName: toName,
      consigneeName,
      from: origin,
      to: station,
      truckNo,
      driverName,
      weight,
      freight: numFreight,
      advance: numAdvance,
      balance,
      copyType: 'Consignee',
    });
  };

  const handleSaveAndConfirm = async () => {
    const payload = {
      load_number: slipNo,
      customer_reference: memoNo,
      consignor: { name: toName || 'Consignor' },
      consignee: { name: consigneeName || 'Consignee' },
      origin_location: { name: origin || 'Yard' },
      destination_location: { name: station || 'Destination' },
      vehicle: { plate_number: truckNo || 'TBD' },
      driver: { name: driverName || 'Driver', phone: driverPhone || '' },
      total_freight: numFreight,
      advance_amount: numAdvance,
      balance_amount: balance,
      status: 'dispatched',
    };

    try {
      const created = await createLoadMutation.mutateAsync(payload);
      if (onSuccess) {
        onSuccess(created);
      }
      toast.success(`Consignment ${slipNo} admitted successfully!`);
      onClose();
    } catch (err: any) {
      toast.error('Failed to admit consignment. Please check inputs.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden my-6">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0B1E38] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 shadow-inner">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-saffron-500/20 px-2 py-0.5 text-xs font-bold text-saffron-300 border border-saffron-500/30 tracking-wider">
                  TECHOFAY GLOBAL VENTURES
                </span>
                <span className="text-xs text-slate-300 font-medium">Fleet & Transport Operations Console</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Consignment Admission & Booking Advice Slip</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950">
          
          {/* Section 1: Slip & Booking Info */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 p-4.5 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> 1. Booking & Reference Identifiers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Slip / Advice No.</label>
                <input
                  type="text"
                  value={slipNo}
                  onChange={(e) => setSlipNo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trip Memo No.</label>
                <input
                  type="text"
                  value={memoNo}
                  onChange={(e) => setMemoNo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Booking Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Order Mode</label>
                <select
                  value={orderSource}
                  onChange={(e) => setOrderSource(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                >
                  <option value="Phone">Phone Order</option>
                  <option value="Verbal">Verbal Agreement</option>
                  <option value="Written">Written Work Order</option>
                  <option value="Online">WhatsApp / Online Portal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Consignor & Consignee */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 p-4.5 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> 2. Consignor, Consignee & Route Stations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Consignor (To Party Name & Address)</label>
                <input
                  type="text"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  placeholder="e.g. Reliance Industries, Hazira Yard"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Consignee (Delivery Destination Party)</label>
                <input
                  type="text"
                  value={consigneeName}
                  onChange={(e) => setConsigneeName(e.target.value)}
                  placeholder="e.g. Tata Motors Plant, Sanand"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Origin Station / Loading Hub</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Vadodara Yard, NH-8"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">For Station (Destination City / Corridor)</label>
                <input
                  type="text"
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  placeholder="e.g. Ahmedabad Logistics Park"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Vehicle, Driver & Owner */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 p-4.5 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400 flex items-center gap-2">
              <User className="h-4 w-4" /> 3. Vehicle, Driver & Fleet Owner Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Truck / Vehicle Reg. No.</label>
                <input
                  type="text"
                  value={truckNo}
                  onChange={(e) => setTruckNo(e.target.value)}
                  placeholder="e.g. GJ 06 AX 4412"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono font-bold text-saffron-600 dark:text-saffron-400 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Driver Full Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Driver Phone No.</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="e.g. +91 98250 12345"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Truck Owner / Transporter Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Techofay Logistics Fleet"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Owner Address / Registered Yard</label>
                <input
                  type="text"
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e.target.value)}
                  placeholder="e.g. NH-8 Highway Yard, Vadodara, Gujarat"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Cargo & Financials */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 p-4.5 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400 flex items-center gap-2">
              <Receipt className="h-4 w-4" /> 4. Weight, Freight Charges & Settlement Terms
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Weight (MT / Tonnes)</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 24.5"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rate of Rs. (per MT / Fixed)</label>
                <input
                  type="text"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 1850"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Total Freight (Rs.)</label>
                <input
                  type="number"
                  value={freight}
                  onChange={(e) => setFreight(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono font-bold text-navy-800 dark:text-saffron-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Advance Paid (Rs.)</label>
                <input
                  type="number"
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Balance Due (Rs.)</label>
                <div className="w-full rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/30 px-3 py-2 text-sm font-mono font-bold text-amber-800 dark:text-amber-300 shadow-2xs">
                  ₹ {balance.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Detention Rate (Rs./Day)</label>
                <input
                  type="text"
                  value={detentionPerDay}
                  onChange={(e) => setDetentionPerDay(e.target.value)}
                  placeholder="1500"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-rose-600 dark:text-rose-400 font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition shadow-2xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">To Pay / Payment Terms</label>
                <input
                  type="text"
                  value={toPay}
                  onChange={(e) => setToPay(e.target.value)}
                  placeholder="To be billed / 15 Days Net"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Trip Memo Operational Deductions & Fuel Advances */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 p-4.5 space-y-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400 flex items-center gap-2">
                <Layers className="h-4 w-4" /> 5. Trip Memo Operational Deductions & Fuel Advances
              </h3>
              <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2.5 py-1 rounded-md">
                Total Deductions: ₹ {totalDeductions.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Commission (Rs.)</label>
                <input
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tapal (Rs.)</label>
                <input
                  type="number"
                  value={tapal}
                  onChange={(e) => setTapal(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Guide / Escort (Rs.)</label>
                <input
                  type="number"
                  value={guide}
                  onChange={(e) => setGuide(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Crane + Godown (Rs.)</label>
                <input
                  type="number"
                  value={craneGodown}
                  onChange={(e) => setCraneGodown(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Incoming Hamali (Rs.)</label>
                <input
                  type="number"
                  value={incomingHamali}
                  onChange={(e) => setIncomingHamali(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Hand Loan (Rs.)</label>
                <input
                  type="number"
                  value={handLoan}
                  onChange={(e) => setHandLoan(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Memo Hand Loan (Rs.)</label>
                <input
                  type="number"
                  value={memoHandLoan}
                  onChange={(e) => setMemoHandLoan(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">Diesel Advance (Rs.)</label>
                <input
                  type="number"
                  value={diesel}
                  onChange={(e) => setDiesel(e.target.value)}
                  className="w-full rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1.5 text-xs font-mono font-bold text-rose-700 dark:text-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadLoadingSlip}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-saffron-600 dark:text-saffron-400" />
              Download Loading Slip
            </button>
            <button
              type="button"
              onClick={handleDownloadTripMemo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
            >
              <FileText className="h-3.5 w-3.5 text-navy-700 dark:text-sky-400" />
              Download Trip Memo
            </button>
            <button
              type="button"
              onClick={handleDownloadBilty}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
            >
              <Receipt className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Download 4-Copy Bilty
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-slate-950 px-5 py-2 text-xs font-bold shadow-md hover:shadow-lg transition active:scale-98"
            >
              <CheckCircle2 className="h-4 w-4 text-slate-950" />
              Confirm & Register Consignment
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
