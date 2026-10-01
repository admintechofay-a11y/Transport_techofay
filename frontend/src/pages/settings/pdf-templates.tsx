import React, { useState } from 'react';
import {
  Printer,
  Building2,
  CreditCard,
  FileText,
  Upload,
  Save,
  CheckCircle2,
  Download,
} from 'lucide-react';
import {
  downloadLoadingSlipPdf,
  downloadTripMemoPdf,
  downloadBiltyPdf,
} from '@/lib/pdf-downloader';
import { toast } from 'sonner';

export const PdfTemplatesPage: React.FC = () => {
  const [companyName, setCompanyName] = useState('TECHOFAY GLOBAL VENTURES (Fleet & Transport Operations)');
  const [gstin, setGstin] = useState('24AOGPP3611Q1Z4');
  const [pan, setPan] = useState('AOGPP3611Q');
  const [transporterId, setTransporterId] = useState('TRANS-TECHOFAY-01');
  const [address, setAddress] = useState(
    'Golden Chokdi, Highway NH-8, Vadodara, Gujarat - 390022. Phones: +91 93593 39000 / 93776 10333'
  );

  // Bank Details for Bilty / Invoice Remittance
  const [bankName, setBankName] = useState('HDFC Bank (Commercial & Logistics Banking)');
  const [accountNumber, setAccountNumber] = useState('50200049281044');
  const [ifsc, setIfsc] = useState('HDFC0001024');
  const [branch, setBranch] = useState('Golden Chokdi Highway Branch, Vadodara');

  // Terms and conditions (Exact Image 2 & Image 3 legal clauses)
  const [terms, setTerms] = useState(
    '1. Detention charges per day ₹1,500/- shall be charged after 24 hours of reporting.\n' +
      '2. In case of any dispute or claim, subject to Vadodara Jurisdiction only.\n' +
      '3. 10 days ke andar punch karwake original copy submit karna compulsory hai, anyatha payment rok diya jayega.\n' +
      '4. GST under Reverse Charge Mechanism (RCM) is applicable under SAC 9965.\n' +
      '5. The transporter shall not be held liable for leakage, rain damage, or transit delay beyond reasonable control.'
  );

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('techofay_pdf_template_settings');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.companyName) setCompanyName(data.companyName);
        if (data.gstin) setGstin(data.gstin);
        if (data.pan) setPan(data.pan);
        if (data.transporterId) setTransporterId(data.transporterId);
        if (data.address) setAddress(data.address);
        if (data.bankName) setBankName(data.bankName);
        if (data.accountNumber) setAccountNumber(data.accountNumber);
        if (data.ifsc) setIfsc(data.ifsc);
        if (data.branch) setBranch(data.branch);
        if (data.terms) setTerms(data.terms);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    const payload = {
      companyName,
      gstin,
      pan,
      transporterId,
      address,
      bankName,
      accountNumber,
      ifsc,
      branch,
      terms,
    };
    try {
      localStorage.setItem('techofay_pdf_template_settings', JSON.stringify(payload));
      toast.success('Transport branding, bank account details, and legal terms saved!');
    } catch {
      toast.error('Could not save PDF settings to local storage.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Printer className="w-5 h-5 text-saffron-500" />
          PDF Document Templates & Legal Branding
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure official company letterheads, GSTIN/PAN stamps, bank remittance details, and legal clauses for LRs and Bilties
        </p>
      </div>

      {/* Legal Transporter Entity Information */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
          Legal Transporter Header Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Registered Company / Transporter Legal Name *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GSTIN (15-digit) *
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Govt E-Way Portal Transporter ID
            </label>
            <input
              type="text"
              value={transporterId}
              onChange={(e) => setTransporterId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono uppercase"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Registered Head Office Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
            />
          </div>
        </div>
      </div>

      {/* Bank Account Details (Printed on Bilty Footer for RTGS/NEFT payments) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
          Freight Payment Bank Remittance Details (Printed on Bilties & Invoices)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bank Name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Account Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bank IFSC Code
            </label>
            <input
              type="text"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Branch Name
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
            />
          </div>
        </div>
      </div>

      {/* Indian Road Transport Terms and Conditions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
          Carriage Conditions & Legal Clauses (Printed on Back / Footer of Bilty)
        </h3>

        <div className="text-xs">
          <textarea
            rows={6}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 font-mono text-[11px] leading-relaxed"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadLoadingSlipPdf({
                slipNo: '201',
                date: new Date().toLocaleDateString('en-IN'),
                toName: 'Consignor Enterprise',
                truckNo: 'TRUCK-01',
                station: 'Destination Terminal',
                weight: '0.0 MT',
                rate: '₹ 0 / MT',
                advance: 0,
                balance: 0,
                toPay: 'To Be Billed',
              })
            }
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-navy-700 dark:text-navy-400" />
            Download Loading Slip Template
          </button>

          <button
            type="button"
            onClick={() =>
              downloadTripMemoPdf({
                memoNo: '101',
                date: new Date().toLocaleDateString('en-IN'),
                truckNo: 'TRUCK-01',
                from: 'Origin Terminal',
                to: 'Destination Hub',
                driverName: 'Assigned Driver',
                ownerName: companyName,
                weight: 0,
                rate: 0,
                freight: 0,
                advance: 0,
                commission: 0,
                tapal: 0,
                guide: 0,
                craneGodown: 0,
                incomingHamali: 0,
                handLoan: 0,
                memoHandLoan: 0,
                dieselAdvance: 0,
              })
            }
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Download Trip Memo Template
          </button>

          <button
            type="button"
            onClick={() =>
              downloadBiltyPdf({
                biltyNumber: 'BL-PREVIEW',
                date: new Date().toLocaleDateString('en-IN'),
                consignorName: 'Consignor Enterprise',
                consigneeName: 'Consignee Enterprise',
                from: 'Origin Terminal',
                to: 'Destination Hub',
                truckNo: 'TRUCK-01',
                packages: 0,
                weight: 0,
                freight: 0,
                advance: 0,
                balance: 0,
                ewayBill: 'EWB-000000000000',
              })
            }
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Download Bilty (4-Copy) Template
          </button>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-saffron-500/20 active:scale-95 transition"
        >
          <Save className="w-4 h-4" />
          Save Templates & Branding
        </button>
      </div>
    </div>
  );
};
