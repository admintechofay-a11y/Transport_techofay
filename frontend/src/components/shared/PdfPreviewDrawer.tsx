import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  Share2,
  Receipt,
  FileSignature,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { WhatsAppShareButton } from './WhatsAppShareButton';
import {
  downloadLoadingSlipPdf,
  downloadTripMemoPdf,
  downloadBiltyPdf,
  downloadLrPdf,
  printA4Html,
  BTS_COMPANY_INFO,
} from '@/lib/pdf-downloader';
import { toast } from 'sonner';

export interface PdfPreviewDrawerProps {
  title: string;
  pdfUrl?: string;
  filename?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  onShareWhatsApp?: () => void;
  documentType?: 'loading_slip' | 'trip_memo' | 'lr' | 'bilty' | 'challan' | 'statement' | 'invoice';
  documentId?: string;
  recipientPhone?: string;
  triggerButton?: React.ReactNode;
  data?: any;
}

export const PdfPreviewDrawer: React.FC<PdfPreviewDrawerProps> = ({
  title,
  pdfUrl,
  filename = 'consignment_document.pdf',
  isOpen,
  onClose,
  onDownload,
  onPrint,
  onShareWhatsApp,
  documentType = 'loading_slip',
  documentId = '',
  recipientPhone = '',
  triggerButton,
  data = {},
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<'loading_slip' | 'trip_memo' | 'bilty' | 'lr'>(
    documentType === 'trip_memo'
      ? 'trip_memo'
      : documentType === 'bilty'
      ? 'bilty'
      : documentType === 'lr'
      ? 'lr'
      : 'loading_slip'
  );

  const [biltyCopy, setBiltyCopy] = useState<'Consignee' | 'Consignor' | 'Driver' | 'Transporter'>('Consignee');

  const isVisible = isOpen !== undefined ? isOpen : internalOpen;
  const handleClose = () => {
    if (onClose) onClose();
    else setInternalOpen(false);
  };

  const docNo = data?.load_number || data?.lr_number || data?.bilty_number || filename.replace('.pdf', '') || 'DOC-PENDING';
  const truckNo = data?.vehicle?.plate_number || data?.vehicle_plate || 'Unassigned';
  const consignor = data?.consignor?.name || 'Consignor';
  const consignee = data?.consignee?.name || 'Consignee';
  const origin = data?.origin_location?.name || 'Origin';
  const destination = data?.destination_location?.name || 'Destination';
  const driver = data?.driver?.name || 'Driver';
  const freight = Number(data?.total_freight || 0);
  const advance = Number(data?.advance_amount || 0);
  const balance = Math.max(0, freight - advance);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    if (activeTemplate === 'loading_slip') {
      downloadLoadingSlipPdf({
        slipNo: docNo,
        toName: consignor,
        truckNo,
        station: destination,
        weight: data?.weight || '28.5',
        rate: data?.rate || '1,700',
        advance,
        balance,
      });
    } else if (activeTemplate === 'trip_memo') {
      downloadTripMemoPdf({
        memoNo: `MEMO-${docNo.replace(/[^0-9]/g, '')}`,
        from: origin,
        to: destination,
        truckNo,
        driverName: driver,
        transporterName: consignor,
        freight,
        advance,
        balance,
      });
    } else if (activeTemplate === 'bilty') {
      downloadBiltyPdf({
        biltyNumber: `BL-${docNo.replace(/[^0-9]/g, '')}`,
        consignorName: consignor,
        consigneeName: consignee,
        from: origin,
        to: destination,
        truckNo,
        driverName: driver,
        freight,
        advance,
        balance,
        copyType: biltyCopy,
      });
    } else {
      downloadLrPdf({
        lrNumber: docNo,
        consignorName: consignor,
        consigneeName: consignee,
        origin,
        destination,
        vehiclePlate: truckNo,
        driverName: driver,
        freight,
      });
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    const previewEl = document.getElementById('printable-preview-content');
    if (previewEl) {
      printA4Html(previewEl.innerHTML, `${activeTemplate.toUpperCase()}-${docNo}`);
    } else {
      window.print();
    }
  };

  return (
    <>
      {triggerButton && (
        <span onClick={() => setInternalOpen(true)}>{triggerButton}</span>
      )}

      {isVisible && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-4xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-[#0F2D56] text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/20 text-white shadow-sm">
                    <img src="/techofay-logo.png" alt="Techofay" className="h-6 w-auto object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{title}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 border border-accent/40 text-accent font-bold">
                        {docNo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      TECHOFAY GLOBAL VENTURES • Fleet & Transport Hub
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs font-bold shadow-md transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print A4</span>
                  </button>

                  {onShareWhatsApp ? (
                    <button
                      type="button"
                      onClick={onShareWhatsApp}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  ) : (
                    <WhatsAppShareButton
                      documentType={activeTemplate}
                      documentId={documentId}
                      documentNumber={docNo}
                      recipientPhone={recipientPhone}
                    />
                  )}

                  <button
                    onClick={handleClose}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Template Switcher Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-bold mr-2 text-[11px] uppercase tracking-wider">Format:</span>
                  <button
                    type="button"
                    onClick={() => setActiveTemplate('loading_slip')}
                    className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
                      activeTemplate === 'loading_slip'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Loading Slip (Official)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplate('trip_memo')}
                    className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
                      activeTemplate === 'trip_memo'
                        ? 'bg-accent text-white shadow-xs'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Trip Memo (Challan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplate('bilty')}
                    className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
                      activeTemplate === 'bilty'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    Bilty (4 Copies)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplate('lr')}
                    className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
                      activeTemplate === 'lr'
                        ? 'bg-navy-900 text-white shadow-xs'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    LR Note
                  </button>
                </div>

                {activeTemplate === 'bilty' && (
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                    {(['Consignee', 'Consignor', 'Driver', 'Transporter'] as const).map((cp) => (
                      <button
                        key={cp}
                        onClick={() => setBiltyCopy(cp)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          biltyCopy === cp ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {cp}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scrollable Document Preview Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
                <div
                  id="printable-preview-content"
                  className="w-full max-w-2xl bg-white text-slate-900 shadow-2xl p-8 rounded border border-slate-300 min-h-[750px] text-xs font-sans"
                >
                  
                  {/* TEMPLATE 1: LOADING SLIP (IMAGE 2) */}
                  {activeTemplate === 'loading_slip' && (
                    <div className="border-2 border-black p-5">
                      <div className="border border-dashed border-slate-600 p-4">
                        <div className="flex justify-between items-start">
                          <div className="text-xl font-black tracking-widest text-blue-900">
                            =[ TGV ]=
                          </div>
                          <div className="text-right text-[11px] font-bold leading-tight">
                            <div>(M) {BTS_COMPANY_INFO.phones[0]}</div>
                            <div>{BTS_COMPANY_INFO.phones[1]}</div>
                            <div>{BTS_COMPANY_INFO.phones[2]}</div>
                            <div className="text-blue-800">Techofay: +91 93593 39000</div>
                          </div>
                        </div>

                        <div className="text-center -mt-2 mb-3">
                          <h1 className="text-2xl font-black text-red-700 tracking-wide">
                            {BTS_COMPANY_INFO.name}
                          </h1>
                          <div className="inline-block border border-black px-3 py-0.5 text-[11px] font-black uppercase mt-1">
                            {BTS_COMPANY_INFO.tagline}
                          </div>
                          <p className="text-[10px] text-slate-700 mt-1 leading-snug">
                            {BTS_COMPANY_INFO.address}<br />
                            E-mail: <b>{BTS_COMPANY_INFO.email}</b> | techofay.com
                          </p>
                        </div>

                        <div className="flex justify-between border-t border-b border-black py-1 font-bold text-xs">
                          <div>No.: <span className="font-mono text-sm">{docNo}</span></div>
                          <div>Date: <span className="font-mono text-sm">{new Date().toLocaleDateString('en-IN')}</span></div>
                        </div>

                        <div className="mt-4 space-y-2 text-xs leading-relaxed">
                          <div>
                            <b>To,</b> <span className="border-b border-dotted border-black inline-block min-w-[350px] font-bold">{consignor}</span>
                          </div>
                          <div><b>Dear Sir,</b></div>
                          <div className="italic text-slate-600">As per your Order / Verbal / Phone / Written</div>

                          <div className="grid grid-cols-[180px_1fr] gap-y-2 pt-2 items-baseline">
                            <span className="font-bold">We have sent Truck / Tempo No.:</span>
                            <span className="font-mono font-bold border-b border-dotted border-black">{truckNo}</span>

                            <span className="font-bold">For Station:</span>
                            <span className="font-semibold border-b border-dotted border-black">{destination}</span>

                            <span className="font-bold">Weight:</span>
                            <span className="font-semibold border-b border-dotted border-black">{data?.weight ? `${data.weight} MT` : '28.5 MT'}</span>

                            <span className="font-bold">Rate of Rs.:</span>
                            <span className="font-semibold border-b border-dotted border-black">₹ {data?.rate || '1,700'} / MT</span>

                            <span className="font-bold">Advance Rs.:</span>
                            <span className="font-mono font-bold text-emerald-700 border-b border-dotted border-black">₹ {advance.toLocaleString('en-IN')}</span>

                            <span className="font-bold">Balance:</span>
                            <span className="font-mono font-bold text-red-700 border-b border-dotted border-black">₹ {balance.toLocaleString('en-IN')}</span>

                            <span className="font-bold">To Pay / To be billed:</span>
                            <span className="font-semibold border-b border-dotted border-black">To be billed to Consignor Account</span>

                            <span className="font-bold text-red-700">Detention per day:</span>
                            <span className="font-bold text-red-700 border-b border-dotted border-black">Rs. 1500/-</span>
                          </div>

                          <div className="font-bold underline pt-2">
                            Please arrange to load the vehicle as early as Possible
                          </div>
                          <div>Thanking You,</div>
                        </div>

                        <div className="flex justify-between items-end mt-8 pt-2">
                          <div className="font-mono text-xs">
                            <b>PAN No.:</b> <span className="font-bold">{BTS_COMPANY_INFO.pan}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs mb-8">Your's Faithfully,</div>
                            <div className="font-black text-red-700">For, {BTS_COMPANY_INFO.name}</div>
                          </div>
                        </div>

                        <div className="mt-4 border border-black p-2 text-[9px] bg-slate-50 leading-snug">
                          <p className="font-semibold mb-1">
                            The {BTS_COMPANY_INFO.name} hereby specifically stipulates that it shall not be responsible in any way or any case for accident, damage, theft, etc. after the loaded Vehicle Starts for the journey.
                          </p>
                          <p className="font-bold">
                            Note: Please check up engine no., chassis no. and other documents Pertaining to Vehicle & Driver for your satisfaction.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TEMPLATE 2: TRIP MEMO (IMAGE 3) */}
                  {activeTemplate === 'trip_memo' && (
                    <div className="border-2 border-black p-4">
                      <div className="flex justify-between items-center border-b border-black pb-1">
                        <div><b>MEMO NO.:</b> <span className="font-mono font-bold">{`MEMO-${docNo.replace(/[^0-9]/g, '')}`}</span></div>
                        <div className="text-lg font-black text-blue-900">=[ TGV ]=</div>
                        <div><b>DATE:</b> <span className="font-mono font-bold">{new Date().toLocaleDateString('en-IN')}</span></div>
                      </div>

                      <div className="text-center my-2">
                        <h2 className="text-xl font-black text-red-700 m-0">{BTS_COMPANY_INFO.name}</h2>
                        <p className="text-[10px] text-slate-600 m-0">
                          {BTS_COMPANY_INFO.address}<br />
                          (M) {BTS_COMPANY_INFO.phones.join(', ')} • {BTS_COMPANY_INFO.email}
                        </p>
                      </div>

                      <table className="w-full border-collapse border border-black mt-2 text-xs">
                        <tbody>
                          <tr>
                            <td className="border border-black p-1.5 w-1/2"><b>From:</b> {origin}</td>
                            <td className="border border-black p-1.5 w-1/2"><b>To:</b> {destination}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-1.5"><b>Truck No.:</b> <span className="font-mono font-bold">{truckNo}</span></td>
                            <td className="border border-black p-1.5"><b>Driver Name:</b> {driver}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-1.5"><b>Owner Name:</b> {data?.vehicle?.owner_name || 'Fleet Owner / Carrier'}</td>
                            <td className="border border-black p-1.5"><b>Phone No.:</b> <span className="font-mono font-bold">{data?.driver?.phone || 'N/A'}</span></td>
                          </tr>
                          <tr>
                            <td colSpan={2} className="border border-black p-1.5"><b>Owner Add.:</b> {data?.vehicle?.owner_address || 'Transport Hub'}</td>
                          </tr>
                        </tbody>
                      </table>

                      <table className="w-full border-collapse border border-black mt-2 text-xs text-center">
                        <thead className="bg-slate-100 font-bold">
                          <tr>
                            <th className="border border-black p-1 text-left">Transporter's Name</th>
                            <th className="border border-black p-1">Freight</th>
                            <th className="border border-black p-1">Advance</th>
                            <th className="border border-black p-1">Balance</th>
                            <th className="border border-black p-1">To Pay</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black p-1 text-left font-bold">{consignor}</td>
                            <td className="border border-black p-1 font-mono font-bold">₹ {freight.toLocaleString('en-IN')}</td>
                            <td className="border border-black p-1 font-mono font-bold">₹ {advance.toLocaleString('en-IN')}</td>
                            <td className="border border-black p-1 font-mono font-bold">₹ {balance.toLocaleString('en-IN')}</td>
                            <td className="border border-black p-1 font-mono font-bold">₹ {balance.toLocaleString('en-IN')}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Deductions Split Table */}
                      <table className="w-full border-collapse border border-black mt-2 text-xs">
                        <thead className="bg-slate-100 font-bold">
                          <tr>
                            <th className="border border-black p-1 text-left w-[45%]">Payment Ledger</th>
                            <th className="border border-black p-1 text-left w-[55%]">Operational Deductions & Advances</th>
                          </tr>
                        </thead>
                        <tbody className="align-top">
                          <tr>
                            <td className="border border-black p-0">
                              <table className="w-full text-xs">
                                <tbody>
                                  <tr><td className="p-1 border-b border-slate-300">Advance:</td><td className="p-1 border-b border-slate-300 text-right font-mono font-bold">₹ {advance.toLocaleString('en-IN')}</td></tr>
                                  <tr><td className="p-1 border-b border-slate-300">Balance:</td><td className="p-1 border-b border-slate-300 text-right font-mono font-bold">₹ {balance.toLocaleString('en-IN')}</td></tr>
                                  <tr><td className="p-1 border-b border-slate-300">Local:</td><td className="p-1 border-b border-slate-300 text-right font-mono">₹ 1,200</td></tr>
                                  <tr><td className="p-1 border-b border-slate-300">Hamali:</td><td className="p-1 border-b border-slate-300 text-right font-mono">₹ 1,800</td></tr>
                                  <tr className="bg-slate-100 font-bold"><td className="p-1">Total:</td><td className="p-1 text-right font-mono text-blue-900">₹ {(freight + 3000).toLocaleString('en-IN')}</td></tr>
                                </tbody>
                              </table>
                            </td>
                            <td className="border border-black p-0">
                              <table className="w-full text-xs">
                                <tbody>
                                  <tr><td className="p-1 border-b border-slate-200">Commission:</td><td className="p-1 border-b border-slate-200 text-right font-mono">₹ 1,500</td></tr>
                                  <tr><td className="p-1 border-b border-slate-200">Tapal / Guide:</td><td className="p-1 border-b border-slate-200 text-right font-mono">₹ 500</td></tr>
                                  <tr><td className="p-1 border-b border-slate-200">Crane + Godown:</td><td className="p-1 border-b border-slate-200 text-right font-mono">₹ 2,000</td></tr>
                                  <tr><td className="p-1 border-b border-slate-200">Incoming Hamali:</td><td className="p-1 border-b border-slate-200 text-right font-mono">₹ 800</td></tr>
                                  <tr><td className="p-1 border-b border-slate-200">Hand Loan & Memo:</td><td className="p-1 border-b border-slate-200 text-right font-mono">₹ 4,000</td></tr>
                                  <tr className="bg-red-50 text-red-700 font-bold"><td className="p-1">Diesel Advance:</td><td className="p-1 text-right font-mono">₹ 12,000</td></tr>
                                  <tr className="bg-slate-100 font-black"><td className="p-1">TOTAL DEDUCTIONS:</td><td className="p-1 text-right font-mono text-red-700">₹ 20,800</td></tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="border border-black p-1.5 mt-2 text-[8.5px] leading-tight bg-amber-50">
                        <b>NOTE: 1)</b> ACKNOWLEDGMENT (PUNCH) IF NOT RECEIVED WITHIN 10 DAYS THE BALANCE PAYMENT WILL NOT BE PAID.
                        <b>2)</b> In case any shortage is found in goods or truck meets with an accident the truck owner will make good for the loss.
                        <b>3)</b> In case goods are not delivered at correct address, truck owner will be responsible.
                        <b>4)</b> Driver should check and verify the articles at loading; if shortage is found, driver will be held responsible.
                      </div>

                      <div className="flex justify-between items-end mt-8 px-2 font-bold text-xs">
                        <div className="border-t border-black pt-1 w-32 text-center">Driver's Signature</div>
                        <div className="border-t border-black pt-1 w-44 text-center text-red-700">For {BTS_COMPANY_INFO.name}</div>
                      </div>
                    </div>
                  )}

                  {/* TEMPLATE 3: BILTY (4-COPY NOTE) */}
                  {activeTemplate === 'bilty' && (
                    <div className="border-2 border-black p-5">
                      <div className="flex justify-between items-center border-b-2 border-black pb-2">
                        <span className="bg-blue-900 text-white font-extrabold px-3 py-1 rounded text-xs tracking-wider uppercase">
                          {biltyCopy} COPY
                        </span>
                        <div className="text-center">
                          <h2 className="text-xl font-black text-red-700 m-0">{BTS_COMPANY_INFO.name}</h2>
                          <div className="text-[10px] font-bold">GOODS CONSIGNMENT NOTE (BILTY) — GST SAC: 9965</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-sm">BL-{docNo.replace(/[^0-9]/g, '')}</div>
                          <div className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</div>
                        </div>
                      </div>

                      <div className="text-center text-[10px] py-1 border-b border-black text-slate-600">
                        {BTS_COMPANY_INFO.address} | Phones: {BTS_COMPANY_INFO.phones.join(' / ')} | GSTIN: {BTS_COMPANY_INFO.gstin}
                      </div>

                      <div className="grid grid-cols-2 gap-2 border border-black p-2 mt-2 text-xs">
                        <div><b>Consignor:</b> {consignor}</div>
                        <div><b>Consignee:</b> {consignee}</div>
                        <div><b>From:</b> {origin}</div>
                        <div><b>To:</b> {destination}</div>
                        <div><b>Truck No:</b> <span className="font-mono font-bold">{truckNo}</span></div>
                        <div><b>Driver:</b> {driver}</div>
                        <div><b>E-Way Bill:</b> {data?.eway_bill_number || 'N/A'}</div>
                        <div><b>Regime:</b> Reverse Charge Mechanism (RCM)</div>
                      </div>

                      <table className="w-full border-collapse border border-black mt-2 text-xs text-center">
                        <thead className="bg-slate-100 font-bold">
                          <tr>
                            <th className="border border-black p-1.5">Packages</th>
                            <th className="border border-black p-1.5">Description</th>
                            <th className="border border-black p-1.5">Weight (MT)</th>
                            <th className="border border-black p-1.5">Freight</th>
                            <th className="border border-black p-1.5">Advance</th>
                            <th className="border border-black p-1.5">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black p-1.5 font-bold font-mono">{data?.total_packages || 1} Units</td>
                            <td className="border border-black p-1.5">{data?.cargo_description || 'General Cargo'}</td>
                            <td className="border border-black p-1.5 font-bold font-mono">{data?.weight_mt || data?.weight || 0} MT</td>
                            <td className="border border-black p-1.5 font-bold font-mono">₹ {freight.toLocaleString('en-IN')}</td>
                            <td className="border border-black p-1.5 font-bold font-mono text-emerald-700">₹ {advance.toLocaleString('en-IN')}</td>
                            <td className="border border-black p-1.5 font-bold font-mono text-red-700">₹ {balance.toLocaleString('en-IN')}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="flex justify-between items-end mt-12 pt-2 border-t border-slate-300 font-bold text-xs">
                        <div>Receiver / Consignee Signature</div>
                        <div>For {BTS_COMPANY_INFO.name}</div>
                      </div>
                    </div>
                  )}

                  {/* TEMPLATE 4: LORRY RECEIPT (LR) */}
                  {activeTemplate === 'lr' && (
                    <div className="border-2 border-black p-5">
                      <div className="text-center border-b-2 border-black pb-2">
                        <h1 className="text-2xl font-black text-blue-950 uppercase">{BTS_COMPANY_INFO.name}</h1>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          LORRY RECEIPT (LR) — STATUTORY CARRIAGE DOCUMENT
                        </p>
                        <p className="text-[10px] text-slate-500">{BTS_COMPANY_INFO.address} • PAN: {BTS_COMPANY_INFO.pan} • GSTIN: {BTS_COMPANY_INFO.gstin}</p>
                      </div>

                      <div className="flex justify-between py-2 border-b border-black text-xs font-bold">
                        <div>LR Number: <span className="font-mono text-sm">{docNo}</span></div>
                        <div>Date: <span className="font-mono">{new Date().toLocaleDateString('en-IN')}</span></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border border-black p-3 mt-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-500 block mb-1">CONSIGNOR</span>
                          <p className="font-bold">{consignor}</p>
                          <p className="text-slate-600">Origin: {origin}</p>
                        </div>
                        <div className="border-l border-black pl-3">
                          <span className="font-bold text-slate-500 block mb-1">CONSIGNEE</span>
                          <p className="font-bold">{consignee}</p>
                          <p className="text-slate-600">Destination: {destination}</p>
                        </div>
                      </div>

                      <div className="border border-black mt-3 p-3 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span>Vehicle Plate:</span>
                          <span className="font-mono font-bold">{truckNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Driver in Charge:</span>
                          <span className="font-bold">{driver}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Goods Description:</span>
                          <span>Industrial Steel Fabrications</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-300 pt-1 font-bold">
                          <span>Freight Agreed:</span>
                          <span className="font-mono text-sm">₹ {freight.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="mt-12 flex justify-between items-end text-xs font-bold">
                        <div className="border-t border-black pt-1 w-32 text-center">Driver Signature</div>
                        <div className="border-t border-black pt-1 w-44 text-center">Authorized Transporter Sign</div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Drawer Bottom Bar */}
              <div className="px-6 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs flex items-center justify-between">
                <span className="text-slate-500">
                  Ready to download & print • Standard A4 Format (Techofay Global Ventures Official Templates)
                </span>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save as PDF
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
