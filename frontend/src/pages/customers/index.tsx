import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Download,
  Share2,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { formatINR } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { downloadCustomerStatementPdf, downloadCsv } from '@/lib/pdf-downloader';
import { toast } from 'sonner';
import { useCustomers, useCreateCustomer } from '@/hooks/use-customers';
import { useLoads } from '@/hooks/use-loads';
import { useBilties } from '@/hooks/use-bilties';
import { CustomerParty } from '@/types/customer.types';
import { EmptyState } from '@/components/shared/EmptyState';

export const CustomersPage: React.FC = () => {
  const { data: customersResponse, isLoading } = useCustomers();
  const createCustomerMutation = useCreateCustomer();
  const { data: loadsResponse } = useLoads();
  const { data: biltiesResponse } = useBilties();

  const customers: CustomerParty[] = customersResponse?.data || [];
  const serverLoads = loadsResponse?.data || [];
  const serverBilties = biltiesResponse?.data || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [drawerCustomer, setDrawerCustomer] = useState<CustomerParty | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'Consignor' | 'Consignee' | 'Corporate' | 'Broker'>('Consignor');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('30 Days Net');

  const handleSaveCustomer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      toast.error('Please enter company/trader name and contact phone');
      return;
    }

    const cleanGstin = formGstin.trim().toUpperCase();
    const payload: Partial<CustomerParty> = {
      name: formName.trim(),
      type: formType,
      party_type: formType === 'Consignor' ? 'consignor' : (formType === 'Consignee' ? 'consignee' : 'customer'),
      billing_city: formCity.trim(),
      city: formCity.trim(),
      billing_state: formState.trim(),
      state: formState.trim(),
      gstin: cleanGstin,
      pan_number: formPan.trim().toUpperCase() || (cleanGstin.length >= 12 ? cleanGstin.substring(2, 12) : ''),
      pan: formPan.trim().toUpperCase() || (cleanGstin.length >= 12 ? cleanGstin.substring(2, 12) : ''),
      phone: formPhone.trim(),
      contact_person: formContactPerson.trim() || formName.trim(),
      credit_limit: Number(formCreditLimit) || 0,
      payment_terms: formPaymentTerms || '30 Days Net',
    };

    createCustomerMutation.mutate(payload, {
      onSuccess: () => {
        setIsAddCustomerOpen(false);
        setFormName('');
        setFormPhone('');
        setFormGstin('');
        setFormPan('');
        setFormCity('');
        setFormState('');
        setFormContactPerson('');
      },
    });
  };

  const filtered = customers.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city || c.billing_city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.gstin || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Customers, Consignors & Consignees
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-100 dark:bg-navy-950/60 text-navy-800 dark:text-navy-300">
              {customers.length} Parties
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage GST accounts, credit limits, outstanding freight ledgers, and statement dispatches
          </p>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="px-4 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-saffron-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          Add Customer Party
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Company, City, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4">GSTIN & PAN</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 hidden md:table-cell">Contact Person</th>
                <th className="py-3 px-4 text-center">Active Loads</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Outstanding (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-saffron-500" />
                    <p className="text-xs">Loading customer directory...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8">
                    <EmptyState
                      icon={Building2}
                      title="No Customers"
                      description="Add consignors and consignees to your directory"
                      actionLabel="Add Customer Party"
                      onAction={() => setIsAddCustomerOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id || c.uuid}
                    onClick={() => setDrawerCustomer(c)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-navy-950 dark:text-white group-hover:text-saffron-600 transition block">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {c.party_type || c.type || 'Party'} • {c.payment_terms || 'Net 30'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{c.gstin || '-'}</div>
                      <span className="text-[10px] text-slate-400">PAN: {c.pan || c.pan_number || '-'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{c.city || c.billing_city || '-'}</div>
                      <span className="text-[10px] text-slate-400">{c.state || c.billing_state || '-'}</span>
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{c.contact_person || c.name}</div>
                      <span className="text-[10px] font-mono text-slate-400">{c.phone}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {c.active_loads_count || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatINR(c.credit_limit || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      <span
                        className={`font-bold ${
                          (c.outstanding_balance || 0) > 0
                            ? 'text-saffron-600 dark:text-saffron-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatINR(c.outstanding_balance || 0)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setDrawerCustomer(c)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
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

      {/* Customer Ledger Statement Drawer */}
      {drawerCustomer && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setDrawerCustomer(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {drawerCustomer.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  GSTIN: {drawerCustomer.gstin || 'N/A'} • {drawerCustomer.city || drawerCustomer.billing_city || 'India'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success(`Statement dispatched to ${drawerCustomer.phone} via WhatsApp!`)}
                  className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                  title="Share Statement on WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    downloadCustomerStatementPdf({
                      customerName: drawerCustomer.name,
                      gstin: drawerCustomer.gstin,
                      totalFreight: drawerCustomer.total_billed || 0,
                      totalAdvance: drawerCustomer.total_paid || 0,
                      balanceDue: drawerCustomer.outstanding_balance || 0,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                  title="Download Customer Statement PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF Statement
                </button>
                {(() => {
                  const customerTransactions = drawerCustomer ? [
                    ...serverBilties
                      .filter((b) => (b.consignor_name || '').toLowerCase().includes(drawerCustomer.name.toLowerCase()) || (b.consignee_name || '').toLowerCase().includes(drawerCustomer.name.toLowerCase()))
                      .map((b) => ({
                        date: b.bilty_date || b.created_at || new Date().toISOString(),
                        ref: b.bilty_number,
                        particulars: `${b.from_city || ''} → ${b.to_city || ''}`,
                        debit: Number(b.total_freight) || 0,
                        credit: Number(b.advance_amount) || 0,
                        balance: Number(b.balance_amount) || 0,
                      })),
                    ...serverLoads
                      .filter((l) => (l.consignor?.name || '').toLowerCase().includes(drawerCustomer.name.toLowerCase()) || (l.consignee?.name || '').toLowerCase().includes(drawerCustomer.name.toLowerCase()))
                      .map((l) => ({
                        date: l.created_at || new Date().toISOString(),
                        ref: l.load_number || l.id,
                        particulars: `${l.origin_location?.name || ''} → ${l.destination_location?.name || ''}`,
                        debit: Number(l.total_freight) || 0,
                        credit: Number(l.advance_amount) || 0,
                        balance: Math.max(0, (Number(l.total_freight) || 0) - (Number(l.advance_amount) || 0)),
                      }))
                  ] : [];

                  return (
                    <button
                      onClick={() =>
                        downloadCsv(`Ledger_${drawerCustomer.name.replace(/\s+/g, '_')}.csv`, [
                          ['Date', 'Doc Ref', 'Particulars', 'Debit (INR)', 'Credit (INR)', 'Balance (INR)'],
                          ...(customerTransactions.length > 0
                            ? customerTransactions.map(t => [formatDate(t.date), t.ref, t.particulars, t.debit, t.credit, t.balance])
                            : [[formatDate(new Date().toISOString()), 'N/A', 'No recorded transactions', 0, 0, 0]])
                        ])
                      }
                      className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold flex items-center gap-1 shadow-sm hover:bg-navy-800 transition"
                      title="Export Customer Ledger CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Excel CSV
                    </button>
                  );
                })()}
                <button
                  onClick={() => setDrawerCustomer(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-3 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Total Billed</span>
                <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatINR(drawerCustomer.total_billed || 0)}
                </div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Total Received</span>
                <div className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatINR(drawerCustomer.total_paid || 0)}
                </div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Current Outstanding</span>
                <div className="font-mono text-base font-bold text-saffron-600 dark:text-saffron-400 mt-0.5">
                  {formatINR(drawerCustomer.outstanding_balance || 0)}
                </div>
              </div>
            </div>

            {/* Ledger Transactions */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                Recent Ledger Vouchers & Bilties
              </h4>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Doc Ref</th>
                      <th className="py-2.5 px-3">Particulars</th>
                      <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(() => {
                      const customerTransactions = drawerCustomer ? [
                        ...serverBilties
                          .filter((b) => (b.consignor_name || '').toLowerCase().includes(drawerCustomer.name.toLowerCase()) || (b.consignee_name || '').toLowerCase().includes(drawerCustomer.name.toLowerCase()))
                          .map((b) => ({
                            date: b.bilty_date || b.created_at || new Date().toISOString(),
                            ref: b.bilty_number,
                            particulars: `${b.from_city || ''} → ${b.to_city || ''}`,
                            debit: Number(b.total_freight) || 0,
                            credit: Number(b.advance_amount) || 0,
                            balance: Number(b.balance_amount) || 0,
                          })),
                        ...serverLoads
                          .filter((l) => (l.consignor?.name || '').toLowerCase().includes(drawerCustomer.name.toLowerCase()) || (l.consignee?.name || '').toLowerCase().includes(drawerCustomer.name.toLowerCase()))
                          .map((l) => ({
                            date: l.created_at || new Date().toISOString(),
                            ref: l.load_number || l.id,
                            particulars: `${l.origin_location?.name || ''} → ${l.destination_location?.name || ''}`,
                            debit: Number(l.total_freight) || 0,
                            credit: Number(l.advance_amount) || 0,
                            balance: Math.max(0, (Number(l.total_freight) || 0) - (Number(l.advance_amount) || 0)),
                          }))
                      ] : [];

                      if (customerTransactions.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-slate-400">
                              No ledger vouchers or consignments registered for this customer yet.
                            </td>
                          </tr>
                        );
                      }

                      return customerTransactions.map((tx, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 text-slate-500">{formatDate(tx.date)}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold">{tx.ref}</td>
                          <td className="py-2.5 px-3">{tx.particulars}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatINR(tx.debit)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600">{tx.credit > 0 ? formatINR(tx.credit) : '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-saffron-600">{formatINR(tx.balance)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-saffron-500" />
                Add Consignor / Customer Party
              </h3>
              <button onClick={() => setIsAddCustomerOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Trader Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Enterprise Client / Consignor Name"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-saffron-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Party Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  >
                    <option value="Consignor">Consignor (Shipper)</option>
                    <option value="Consignee">Consignee (Receiver)</option>
                    <option value="Corporate">Corporate Account</option>
                    <option value="Broker">Freight Broker</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="e.g. Rajesh Singhania"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN (15-digit)
                  </label>
                  <input
                    type="text"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    placeholder="27AAACU9912K1Z5"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono uppercase focus:ring-2 focus:ring-saffron-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98200 11223"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono focus:ring-2 focus:ring-saffron-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / Station
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Mumbai JNPT"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formPaymentTerms}
                    onChange={(e) => setFormPaymentTerms(e.target.value)}
                    placeholder="30 Days Net"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-saffron-500 hover:bg-saffron-600 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-saffron-500/20 active:scale-95 flex items-center gap-1.5"
                >
                  {createCustomerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
