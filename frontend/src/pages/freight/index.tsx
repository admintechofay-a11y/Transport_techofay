import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  IndianRupee,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Download,
  CreditCard,
  Building2,
  Calendar,
  X,
  Check,
  Receipt,
  AlertCircle,
  Share2,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useFreightCharges, useUpdateFreightCharge } from '@/hooks/use-freight-charges';
import { freightApi } from '@/lib/api/freight.api';
import { FreightCharge } from '@/types/freight.types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatINR } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { downloadCsv } from '@/lib/pdf-downloader';
import { WhatsAppShareButton } from '@/components/shared/WhatsAppShareButton';
import { toast } from 'sonner';

export const FreightPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'charges';

  const { data: serverCharges, isLoading } = useFreightCharges();
  const updateFreightMutation = useUpdateFreightCharge();
  const rawList = Array.isArray(serverCharges) ? serverCharges : (serverCharges as any)?.data;

  const charges: FreightCharge[] = Array.isArray(rawList)
    ? rawList.map((c: any) => ({
        ...c,
        id: c.uuid || c.id,
        total_freight: Number(c.total_charges || c.total_freight || c.freight_amount || 0),
        advance_received: Number(c.advance_paid || c.advance_received || 0),
        balance_payable: Number(c.balance_payable ?? Math.max(0, (c.total_charges || c.total_freight || 0) - (c.advance_paid || c.advance_received || 0))),
        customer_name: c.customer?.name || c.customer_name || 'Customer',
        load_id: c.order?.load_number || c.load_id || `LD-${(c.uuid || c.id || '').toString().slice(0, 8)}`,
        payment_status: c.payment_status || 'pending',
      }))
    : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentModalCharge, setPaymentModalCharge] = useState<FreightCharge | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState('NEFT / RTGS Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');

  // Selected customer for statements tab
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');

  // WhatsApp Reminder State
  const [whatsAppOutstanding, setWhatsAppOutstanding] = useState<any | null>(null);

  const totalRevenue = charges.reduce((acc, c) => acc + (c.total_freight || 0), 0);
  const totalAdvances = charges.reduce((acc, c) => acc + (c.advance_received || 0), 0);
  const totalOutstanding = charges.reduce((acc, c) => acc + (c.balance_payable || 0), 0);

  const filtered = charges.filter((c) => {
    const matchesSearch =
      (c.load_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.lr_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.route || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || (c.payment_status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleOpenPaymentModal = (item: FreightCharge) => {
    setPaymentModalCharge(item);
    setReceivedAmount(String(item.balance_payable));
    setPaymentRef(`UTR-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmPayment = async () => {
    if (!paymentModalCharge) return;
    const num = Number(receivedAmount);
    if (isNaN(num) || num <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const currentAdvance = paymentModalCharge.advance_received || paymentModalCharge.advance_paid || 0;
    const newAdvance = currentAdvance + num;
    const total = paymentModalCharge.total_freight || paymentModalCharge.total_charges || 0;
    const newBalance = Math.max(0, total - newAdvance);

    try {
      const chargeId = (paymentModalCharge.uuid || String(paymentModalCharge.id))!;
      await freightApi.recordPayment(chargeId, {
        amount: num,
        payment_method: paymentMode,
        reference: paymentRef,
        notes: 'Recorded via Freight Billing Console',
      });
      queryClient.invalidateQueries({ queryKey: ['freight-charges'] });
      toast.success(`Payment of ₹${num.toLocaleString('en-IN')} recorded successfully!`);
      setPaymentModalCharge(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record payment on server');
    }
  };

  // Grouped customer statement data
  const customerList = Array.from(new Set(charges.map((c) => c.customer_name).filter(Boolean)));
  const currentCustomer = selectedCustomerName || customerList[0] || '';
  const customerCharges = charges.filter((c) => c.customer_name === currentCustomer);
  const customerTotalBilled = customerCharges.reduce((acc, c) => acc + (c.total_freight || 0), 0);
  const customerTotalPaid = customerCharges.reduce((acc, c) => acc + (c.advance_received || 0), 0);
  const customerBalanceDue = customerCharges.reduce((acc, c) => acc + (c.balance_payable || 0), 0);

  // Outstanding dues list (charges with balance > 0)
  const outstandingCharges = charges.filter((c) => (c.balance_payable || 0) > 0);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {activeTab === 'statements'
                ? 'Customer Account Statements & Ledger'
                : activeTab === 'outstanding'
                ? 'Outstanding Receivables & Dues'
                : 'Freight Billing & Payment Ledger'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-saffron-100 dark:bg-saffron-950/60 text-saffron-800 dark:text-saffron-300">
              {formatINR(totalOutstanding)} Net Dues
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTab === 'statements'
              ? 'Consignor and consignee ledger statements, payment remittances, and invoices'
              : activeTab === 'outstanding'
              ? 'Track overdue haulage dues, payment delays, and send automated WhatsApp reminders'
              : 'Track gross freight earnings, advance fuel transfers, detention demurrage, and customer outstanding'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Button */}
          <button
            type="button"
            onClick={() => {
              const rows = [
                ['Load ID', 'LR Number', 'Customer', 'Route', 'Base Freight (INR)', 'Total Freight (INR)', 'Advance Paid (INR)', 'Balance Due (INR)', 'Status', 'Date'],
                ...charges.map((c) => [
                  c.load_id || '',
                  c.lr_number || '',
                  c.customer_name || '',
                  c.route || '',
                  c.base_freight || 0,
                  c.total_freight || 0,
                  c.advance_received || 0,
                  c.balance_payable || 0,
                  c.payment_status || '',
                  c.created_at ? formatDate(c.created_at) : '',
                ]),
              ];
              downloadCsv(`Freight_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, rows);
              toast.success('Freight ledger exported to CSV!');
            }}
            className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Download className="w-4 h-4 text-saffron-400" />
            Export Ledger CSV
          </button>
        </div>
      </div>

      {/* 3 Top Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Gross Freight Booked
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatINR(totalRevenue)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Total haulage revenue across all shipments</span>
        </div>

        <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Advances Received / Fuel Paid
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(totalAdvances)}
          </div>
          <span className="text-[11px] text-emerald-600/80 font-medium mt-1 block">Collected upfront / en-route fuel</span>
        </div>

        <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Customer Balance Outstanding
          </span>
          <div className="text-2xl font-bold font-mono text-saffron-600 dark:text-saffron-400 mt-1">
            {formatINR(totalOutstanding)}
          </div>
          <span className="text-[11px] text-saffron-600/80 font-medium mt-1 block">Pending receipt on delivery or 30-day credit</span>
        </div>
      </div>

      {/* Tab Navigation Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'charges' })}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'charges'
              ? 'bg-saffron-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5" />
          Freight Charges & Invoices
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'statements' })}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'statements'
              ? 'bg-saffron-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Customer Statements
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'outstanding' })}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'outstanding'
              ? 'bg-saffron-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Outstanding Dues ({outstandingCharges.length})
        </button>
      </div>

      {/* VIEW 1: FREIGHT CHARGES TABLE */}
      {activeTab === 'charges' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/60">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Load, LR #, Customer, Corridor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              {['all', 'unpaid', 'partial', 'paid'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                    statusFilter === st
                      ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Load & LR Ref</th>
                  <th className="py-3 px-4">Customer Party</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Route Corridor</th>
                  <th className="py-3 px-4 text-right hidden sm:table-cell">Base Freight (₹)</th>
                  <th className="py-3 px-4 text-right">Total Freight (₹)</th>
                  <th className="py-3 px-4 text-right">Advance Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <IndianRupee className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">No freight billing records found</p>
                      <p className="text-xs text-slate-400 mt-1">Book consignments and dispatch shipments to track freight earnings.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-navy-950 dark:text-white block">{item.load_id}</span>
                        <span className="text-[10px] text-slate-400">{item.lr_number}</span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {item.customer_name}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                        {item.route}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold hidden sm:table-cell">
                        {formatINR(item.base_freight)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatINR(item.total_freight)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-semibold">
                        {formatINR(item.advance_received)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-saffron-600 dark:text-saffron-400">
                        {formatINR(item.balance_payable)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={item.payment_status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {item.balance_payable > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(item)}
                            className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-2xs"
                          >
                            Receive Payment
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <Check className="w-3 h-3" /> Fully Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CUSTOMER STATEMENTS & ACCOUNT LEDGER */}
      {activeTab === 'statements' && (
        <div className="space-y-4">
          {/* Customer Selector Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-saffron-500" />
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Customer Party Account:
                </label>
                <select
                  value={currentCustomer}
                  onChange={(e) => setSelectedCustomerName(e.target.value)}
                  className="mt-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {customerList.length > 0 ? (
                    customerList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))
                  ) : (
                    <option value="">No customer accounts found</option>
                  )}
                </select>
              </div>
            </div>

            {/* Customer Net Statement Summary Chips */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[10px]">TOTAL BILLED</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatINR(customerTotalBilled)}</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                <span className="text-emerald-600 block text-[10px]">ADVANCES RECEIVED</span>
                <span className="font-bold">{formatINR(customerTotalPaid)}</span>
              </div>
              <div className="bg-saffron-50 dark:bg-saffron-950/40 px-3 py-1.5 rounded-lg border border-saffron-200 dark:border-saffron-800 text-saffron-800 dark:text-saffron-300">
                <span className="text-saffron-600 block text-[10px]">NET BALANCE DUE</span>
                <span className="font-bold">{formatINR(customerBalanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Customer Itemized Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Statement Vouchers for: <span className="text-saffron-600 dark:text-saffron-400">{currentCustomer || 'Customer'}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const rows = [
                    ['Date', 'Voucher / Load Ref', 'Corridor / Description', 'Debit (Billed)', 'Credit (Received)', 'Balance Due'],
                    ...customerCharges.map((c) => [
                      formatDate(c.created_at),
                      c.load_id,
                      c.route,
                      c.total_freight,
                      c.advance_received,
                      c.balance_payable,
                    ]),
                  ];
                  downloadCsv(`Statement_${(currentCustomer || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}.csv`, rows);
                  toast.success('Customer statement downloaded!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-saffron-400" />
                Download Statement CSV
              </button>
            </div>

            <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Voucher / Load Ref</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Route Corridor</th>
                    <th className="py-3 px-4 text-right">Debit (Billed ₹)</th>
                    <th className="py-3 px-4 text-right">Credit (Received ₹)</th>
                    <th className="py-3 px-4 text-right">Net Balance (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerCharges.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No transactions registered for this party account yet.
                      </td>
                    </tr>
                  ) : (
                    customerCharges.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-slate-500">{formatDate(item.created_at)}</td>
                        <td className="py-3 px-4 font-mono font-bold">{item.load_id}</td>
                        <td className="py-3 px-4 hidden sm:table-cell">{item.route}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatINR(item.total_freight)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                          {formatINR(item.advance_received)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-saffron-600 dark:text-saffron-400">
                          {formatINR(item.balance_payable)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={item.payment_status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: OUTSTANDING AGING DUES & REMINDERS */}
      {activeTab === 'outstanding' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Receivables Outstanding Aging Analysis
                </h3>
                <p className="text-slate-500 text-[11px]">
                  All consignments with unpaid freight balance requiring follow-up or payment collection
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {outstandingCharges.length} Invoices Pending
              </span>
            </div>

            <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Invoice / Load</th>
                    <th className="py-3 px-4">Customer Party</th>
                    <th className="py-3 px-4">Booking Date</th>
                    <th className="py-3 px-4 text-right">Total Invoiced (₹)</th>
                    <th className="py-3 px-4 text-right">Advance Paid (₹)</th>
                    <th className="py-3 px-4 text-right font-bold text-saffron-600">Overdue Balance (₹)</th>
                    <th className="py-3 px-4 text-right">Collection Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {outstandingCharges.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 dark:text-slate-300">Zero Outstanding Dues!</p>
                        <p className="text-xs text-slate-500">All customer shipments are fully collected and settled.</p>
                      </td>
                    </tr>
                  ) : (
                    outstandingCharges.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-mono font-bold">{item.load_id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{item.customer_name}</td>
                        <td className="py-3.5 px-4 text-slate-500">{formatDate(item.created_at)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold">{formatINR(item.total_freight)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-600">{formatINR(item.advance_received)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                          {formatINR(item.balance_payable)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setWhatsAppOutstanding(item)}
                              className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 hover:bg-emerald-100 transition shadow-2xs"
                              title="Send WhatsApp Dues Reminder"
                            >
                              <Share2 className="w-3 h-3" />
                              WhatsApp Dues
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(item)}
                              className="px-3 py-1 rounded bg-saffron-500 hover:bg-saffron-600 text-slate-950 font-bold text-[11px] shadow-2xs"
                            >
                              Record Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Receipt Modal */}
      {paymentModalCharge && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Record Freight Payment Receipt
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalCharge(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Consignment:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{paymentModalCharge.load_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Party:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{paymentModalCharge.customer_name}</span>
                </div>
                <div className="flex justify-between text-saffron-600 dark:text-saffron-400 font-bold border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1">
                  <span>Current Outstanding Balance:</span>
                  <span className="font-mono">{formatINR(paymentModalCharge.balance_payable)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Remittance Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                >
                  <option>NEFT / RTGS Bank Transfer</option>
                  <option>IMPS Quick Transfer</option>
                  <option>UPI / QR Scan</option>
                  <option>Account Payee Cheque</option>
                  <option>Cash Receipt Voucher</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UTR-2026-99210"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalCharge(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  Confirm & Settle Dues
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Outstanding Dues Notification */}
      {whatsAppOutstanding && (
        <WhatsAppShareButton
          documentType="statement"
          documentNumber={whatsAppOutstanding.load_id}
          recipientName={whatsAppOutstanding.customer_name}
          recipientPhone="+919820011223"
          defaultMessage={`Payment Reminder from TECHOFAY GLOBAL VENTURES: Dear ${whatsAppOutstanding.customer_name}, an outstanding freight balance of ${formatINR(whatsAppOutstanding.balance_payable)} for Consignment ${whatsAppOutstanding.load_id} (${whatsAppOutstanding.route}) is pending payment. Please arrange NEFT/RTGS remittance to HDFC Bank A/C: 50200049281044, IFSC: HDFC0001024.`}
        />
      )}
    </div>
  );
};
