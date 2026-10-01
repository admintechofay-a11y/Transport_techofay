import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export interface CompanyHeaderDetails {
  name: string;
  tagline: string;
  address: string;
  phones: string[];
  email: string;
  pan: string;
  gstin?: string;
  branches?: string;
}

export const BTS_COMPANY_INFO: CompanyHeaderDetails = {
  name: 'TECHOFAY GLOBAL VENTURES',
  tagline: 'FLEET & ROAD TRANSPORT OPERATIONS • HAULAGE LOGISTICS',
  address: 'Golden Chokdi, Highway NH-8, Vadodara, Gujarat - 390022',
  phones: ['+91 93593 39000', '+91 93776 10333', '+91 84010 20129'],
  email: 'info@techofay.com',
  pan: 'AOGPP3611Q',
  gstin: '24AOGPP3611Q1Z4',
  branches: 'TechoFay Global Ventures • Vadodara HQ • Bangalore • Chennai • Edinburgh UK',
};

export const TECHOFAY_COMPANY_INFO = BTS_COMPANY_INFO;

export const getActiveCompanyInfo = (): CompanyHeaderDetails => {
  try {
    const raw = localStorage.getItem('techofay_pdf_template_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.companyName) {
        return {
          name: parsed.companyName,
          tagline: BTS_COMPANY_INFO.tagline,
          address: parsed.address || BTS_COMPANY_INFO.address,
          phones: BTS_COMPANY_INFO.phones,
          email: BTS_COMPANY_INFO.email,
          pan: parsed.pan || BTS_COMPANY_INFO.pan,
          gstin: parsed.gstin || BTS_COMPANY_INFO.gstin,
          branches: BTS_COMPANY_INFO.branches,
        };
      }
    }
  } catch {
    // fallback
  }
  return BTS_COMPANY_INFO;
};

/**
 * Native Print Utility
 * Injects a hidden printable iframe or populates print styles to guarantee
 * pixel-perfect A4 printing / Save as PDF in all browsers.
 */
export const printA4Html = (htmlContent: string, title: string = 'Document') => {
  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    toast.error('Popup blocked. Please allow popups to print documents.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 10px;
            font-size: 13px;
            line-height: 1.4;
          }
          .mono { font-family: 'JetBrains Mono', monospace; }
          .border-black { border: 1.5px solid #000; }
          .border-double-thick { border: 3px double #000; }
          .border-b-black { border-bottom: 1px solid #000; }
          .border-r-black { border-right: 1px solid #000; }
          .border-t-black { border-top: 1px solid #000; }
          .table-bordered { width: 100%; border-collapse: collapse; }
          .table-bordered th, .table-bordered td { border: 1px solid #000; padding: 5px 8px; text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .uppercase { text-transform: uppercase; }
          .badge { display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; border: 1px solid #000; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

/**
 * 1. TRUCK LOADING SLIP / BOOKING CONFIRMATION SLIP (Image 2 Template)
 */
export const downloadLoadingSlipPdf = (data: {
  slipNo?: string;
  date?: string;
  toName?: string;
  orderSource?: string;
  truckNo?: string;
  station?: string;
  weight?: string | number;
  rate?: string | number;
  advance?: string | number;
  balance?: string | number;
  toPay?: string | number;
  detentionPerDay?: string | number;
  panNo?: string;
  notes?: string;
}) => {
  const slipNo = data.slipNo || `LS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const date = data.date || new Date().toLocaleDateString('en-IN');
  const panNo = data.panNo || BTS_COMPANY_INFO.pan;
  const detention = data.detentionPerDay || '1500/-';

  const html = `
    <div style="border: 2px solid #000; padding: 20px; max-width: 800px; margin: 0 auto; position: relative;">
      <!-- Outer Decorative Border -->
      <div style="border: 1px dashed #444; padding: 16px;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #1e3a8a;">
            =[ TGV ]=
          </div>
          <div style="text-align: right; font-size: 11px; font-weight: 600; line-height: 1.3;">
            <div>(M) ${BTS_COMPANY_INFO.phones[0]}</div>
            <div>${BTS_COMPANY_INFO.phones[1]}</div>
            <div>${BTS_COMPANY_INFO.phones[2]}</div>
            <div>Techofay: ${BTS_COMPANY_INFO.phones[3]}</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: -10px; margin-bottom: 12px;">
          <h1 style="font-size: 24px; font-weight: 900; margin: 0; color: #b91c1c; letter-spacing: 1px;">
            ${BTS_COMPANY_INFO.name}
          </h1>
          <div style="display: inline-block; border: 1.5px solid #000; padding: 2px 14px; margin-top: 4px; font-weight: 800; font-size: 12px;">
            ${BTS_COMPANY_INFO.tagline}
          </div>
          <p style="margin: 6px 0 0; font-size: 11px; line-height: 1.4;">
            ${BTS_COMPANY_INFO.address}<br/>
            E-mail: <b>${BTS_COMPANY_INFO.email}</b> | techofay.com
          </p>
        </div>

        <!-- No & Date -->
        <div style="display: flex; justify-content: space-between; border-top: 1.5px solid #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-top: 8px;">
          <div><b style="font-size: 14px;">No.:</b> <span class="mono" style="font-size: 14px; font-weight: 700;">${slipNo}</span></div>
          <div><b style="font-size: 14px;">Date:</b> <span class="mono" style="font-size: 14px; font-weight: 700;">${date}</span></div>
        </div>

        <!-- Body Details -->
        <div style="margin-top: 15px; font-size: 13.5px; line-height: 1.8;">
          <div style="margin-bottom: 8px;">
            <b>To,</b> <span style="border-bottom: 1px dotted #000; display: inline-block; min-width: 480px; font-weight: 600;">${data.toName || 'Consignor / Customer'}</span>
          </div>

          <div><b>Dear Sir,</b></div>
          <div style="margin-left: 10px; font-style: italic; color: #333;">
            As per your Order / Verbal / Phone / Written
          </div>

          <div style="margin-top: 10px; display: grid; grid-template-columns: 200px 1fr; row-gap: 8px; align-items: baseline;">
            <div><b>We have sent Truck / Tempo No.:</b></div>
            <div style="border-bottom: 1px dotted #000; font-weight: 700;" class="mono">${data.truckNo || 'Unassigned'}</div>

            <div><b>For Station:</b></div>
            <div style="border-bottom: 1px dotted #000; font-weight: 600;">${data.station || 'Destination'}</div>

            <div><b>Weight:</b></div>
            <div style="border-bottom: 1px dotted #000; font-weight: 600;">${data.weight ? `${data.weight} MT` : 'As per weight slip'}</div>

            <div><b>Rate of Rs.:</b></div>
            <div style="border-bottom: 1px dotted #000; font-weight: 600;">₹ ${data.rate || 'Standard'}</div>

            <div><b>Advance Rs.:</b></div>
            <div style="border-bottom: 1px dotted #000; font-weight: 700; color: #047857;">₹ ${data.advance || '0'}</div>

            <div><b>Balance:</b></div>
            <div style="border-bottom: 1px dotted #000; font-weight: 700; color: #b91c1c;">₹ ${data.balance || '0'}</div>

            <div><b>To Pay / To be billed:</b></div>
            <div style="border-bottom: 1px dotted #000; font-weight: 600;">${data.toPay || 'To be billed to Consignor Account'}</div>

            <div><b>Detention per day:</b></div>
            <div style="border-bottom: 1px dotted #000; font-weight: 700; color: #b91c1c;">Rs. ${detention}</div>
          </div>

          <div style="margin-top: 14px; font-weight: 700; text-decoration: underline;">
            Please arrange to load the vehicle as early as Possible
          </div>
          <div style="margin-top: 4px;">Thanking You,</div>
        </div>

        <!-- Signatures & PAN -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; padding-top: 10px;">
          <div>
            <b>PAN No.:</b> <span class="mono" style="font-weight: 700;">${panNo}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; margin-bottom: 30px;">Your's Faithfully,</div>
            <div style="font-weight: 800; font-size: 13px; color: #b91c1c;">For, ${BTS_COMPANY_INFO.name}</div>
          </div>
        </div>

        <!-- Legal Disclaimer Box (Exact Image 2) -->
        <div style="margin-top: 20px; border: 1.5px solid #000; padding: 10px; font-size: 10px; line-height: 1.4; background: #fafafa;">
          <p style="margin: 0 0 5px; font-weight: 600;">
            The ${BTS_COMPANY_INFO.name} hereby specifically stipulates that it shall not be responsible in any way or any case for accident, damage, theft, etc. after the loaded Vehicle Starts for the journey.
          </p>
          <p style="margin: 0; font-weight: 700;">
            Note: Please check up engine no., chassis no. and other documents Pertaining to Vehicle & Driver for your satisfaction.
          </p>
        </div>

      </div>
    </div>
  `;

  // 1. Generate jsPDF file directly
  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(BTS_COMPANY_INFO.name, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(BTS_COMPANY_INFO.tagline, 105, 26, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(BTS_COMPANY_INFO.address, 105, 31, { align: 'center' });
    doc.text(`(M) ${BTS_COMPANY_INFO.phones.join(' / ')} | Email: ${BTS_COMPANY_INFO.email}`, 105, 36, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`TRUCK LOADING SLIP: ${slipNo}`, 15, 46);
    doc.text(`DATE: ${date}`, 150, 46);

    doc.line(15, 49, 195, 49);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    let y = 58;
    doc.text(`To: ${data.toName || 'Consignor / Customer'}`, 15, y);
    y += 7;
    doc.text('Dear Sir, As per your Order / Verbal / Phone / Written:', 15, y);
    y += 9;

    const fields = [
      ['Truck / Tempo No.:', data.truckNo || 'Unassigned'],
      ['For Station:', data.station || 'Destination'],
      ['Weight:', data.weight ? `${data.weight} MT` : 'As per weight slip'],
      ['Rate of Rs.:', data.rate ? `Rs. ${data.rate}` : 'Standard'],
      ['Advance Rs.:', `Rs. ${data.advance || 0}`],
      ['Balance Rs.:', `Rs. ${data.balance || 0}`],
      ['To Pay / To be billed:', data.toPay || 'To be billed to Consignor'],
      ['Detention per day:', `Rs. ${detention}`],
    ];

    fields.forEach(([lbl, val]) => {
      doc.setFont('Helvetica', 'bold');
      doc.text(String(lbl), 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(String(val), 85, y);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(83, y + 1, 190, y + 1);
      doc.setLineDashPattern([], 0);
      y += 8;
    });

    y += 5;
    doc.setFont('Helvetica', 'bold');
    doc.text('Please arrange to load the vehicle as early as Possible', 15, y);
    y += 6;
    doc.text('Thanking You,', 15, y);

    y += 18;
    doc.text(`PAN No.: ${panNo}`, 15, y);
    doc.text(`For, ${BTS_COMPANY_INFO.name}`, 140, y);

    // Boxed disclaimer
    y += 10;
    doc.rect(15, y, 180, 24);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.text(
      `The ${BTS_COMPANY_INFO.name} hereby specifically stipulates that it shall not be responsible in any way or any case for accident, damage, theft, etc. after the loaded Vehicle Starts for the journey.`,
      18,
      y + 6,
      { maxWidth: 174 }
    );
    doc.setFont('Helvetica', 'bold');
    doc.text(
      'Note: Please check up engine no., chassis no. and other documents Pertaining to Vehicle & Driver for your satisfaction.',
      18,
      y + 18,
      { maxWidth: 174 }
    );

    doc.save(`Loading-Slip-${slipNo}.pdf`);
    toast.success(`Loading Slip ${slipNo} downloaded successfully!`);
  } catch (err) {
    console.error('jsPDF generation failed, falling back to print dialog', err);
    printA4Html(html, `Loading-Slip-${slipNo}`);
  }
};

/**
 * 2. TRIP MEMO / LORRY HIRE CHALLAN (Image 3 Template with complete Expense Breakdown)
 */
export const downloadTripMemoPdf = (data: {
  memoNo?: string;
  date?: string;
  from?: string;
  to?: string;
  truckNo?: string;
  driverName?: string;
  driverPhone?: string;
  ownerName?: string;
  ownerAddress?: string;
  transporterName?: string;
  freight?: number;
  weight?: string | number;
  rate?: string | number;
  advance?: number;
  balance?: number;
  toPay?: number;
  localExpense?: number;
  hamali?: number;
  // Detailed Expense Deductions (Image 3 right column)
  commission?: number;
  tapal?: number;
  guide?: number;
  craneGodown?: number;
  incomingHamali?: number;
  handLoan?: number;
  memoHandLoan?: number;
  diesel?: number;
  dieselAdvance?: number;
}) => {
  const memoNo = data.memoNo || `MEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const date = data.date || new Date().toLocaleDateString('en-IN');

  const freight = Number(data.freight ?? 55000);
  const advance = Number(data.advance ?? 20000);
  const balance = Number(data.balance ?? (freight - advance));
  const toPay = Number(data.toPay ?? balance);
  const localExp = Number(data.localExpense ?? 1200);
  const hamali = Number(data.hamali ?? 1800);
  const subTotalLeft = advance + balance + localExp + hamali;

  // Deductions (Right column of Image 3)
  const comm = Number(data.commission ?? 1500);
  const tapal = Number(data.tapal ?? 150);
  const guide = Number(data.guide ?? 350);
  const crane = Number(data.craneGodown ?? 2000);
  const inHamali = Number(data.incomingHamali ?? 800);
  const handLoan = Number(data.handLoan ?? 3000);
  const memoLoan = Number(data.memoHandLoan ?? 1000);
  const diesel = Number(data.diesel ?? data.dieselAdvance ?? 12000);
  const totalDeductions = comm + tapal + guide + crane + inHamali + handLoan + memoLoan + diesel;

  const html = `
    <div style="border: 2px solid #000; padding: 18px; max-width: 820px; margin: 0 auto;">
      <!-- Memo No & Date -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 6px;">
        <div><b>MEMO NO.:</b> <span class="mono" style="font-weight: 700; font-size: 15px;">${memoNo}</span></div>
        <div style="font-size: 20px; font-weight: 900; color: #1e3a8a;">=[ TGV ]=</div>
        <div><b>DATE:</b> <span class="mono" style="font-weight: 700; font-size: 15px;">${date}</span></div>
      </div>

      <!-- Header -->
      <div style="text-align: center; margin: 10px 0;">
        <h1 style="font-size: 24px; font-weight: 900; color: #b91c1c; margin: 0;">${BTS_COMPANY_INFO.name}</h1>
        <p style="font-size: 11px; margin: 4px 0 0; line-height: 1.4;">
          ${BTS_COMPANY_INFO.address}<br/>
          (M) ${BTS_COMPANY_INFO.phones.join(', ')} • E-mail: <b>${BTS_COMPANY_INFO.email}</b>
        </p>
      </div>

      <!-- Table 1: Route & Vehicle Info -->
      <table class="table-bordered" style="margin-top: 10px; font-size: 12px;">
        <tr>
          <td style="width: 50%;"><b>From:</b> ${data.from || 'Origin'}</td>
          <td style="width: 50%;"><b>To:</b> ${data.to || 'Destination'}</td>
        </tr>
        <tr>
          <td><b>Truck No.:</b> <span class="mono font-bold">${data.truckNo || 'Unassigned'}</span></td>
          <td><b>Driver Name:</b> ${data.driverName || 'Driver'}</td>
        </tr>
        <tr>
          <td><b>Owner Name:</b> ${data.ownerName || 'Fleet Owner / Carrier'}</td>
          <td><b>Phone No.:</b> <span class="mono font-bold">${data.driverPhone || 'N/A'}</span></td>
        </tr>
        <tr>
          <td colspan="2"><b>Owner Add.:</b> ${data.ownerAddress || 'Transport Hub'}</td>
        </tr>
      </table>

      <!-- Table 2: Consignment & Freight Split Grid -->
      <table class="table-bordered text-center" style="margin-top: 10px; font-size: 12px;">
        <tr style="background: #f1f5f9; font-weight: 700;">
          <th style="width: 40%;">Transporter's Name</th>
          <th style="width: 15%;">Freight</th>
          <th style="width: 15%;">Advance</th>
          <th style="width: 15%;">Balance</th>
          <th style="width: 15%;">To Pay</th>
        </tr>
        <tr>
          <td style="text-align: left; font-weight: 600;">${data.transporterName || 'Freight Consignment'}</td>
          <td class="mono font-bold">₹ ${freight.toLocaleString('en-IN')}</td>
          <td class="mono font-bold">₹ ${advance.toLocaleString('en-IN')}</td>
          <td class="mono font-bold">₹ ${balance.toLocaleString('en-IN')}</td>
          <td class="mono font-bold">₹ ${toPay.toLocaleString('en-IN')}</td>
        </tr>
      </table>

      <!-- Table 3: Financial & Operational Deductions Breakdown (Image 3) -->
      <table class="table-bordered" style="margin-top: 10px; font-size: 11.5px;">
        <tr style="background: #f8fafc; font-weight: 700;">
          <th style="width: 45%; text-align: left;">Payment Breakdown</th>
          <th style="width: 55%; text-align: left;">Operational Deductions & Expenses</th>
        </tr>
        <tr style="vertical-align: top;">
          <!-- Left Column -->
          <td style="padding: 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">Advance:</td><td class="text-right mono font-bold" style="padding: 4px 8px; border-bottom: 1px solid #ddd;">₹ ${advance.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">Balance:</td><td class="text-right mono font-bold" style="padding: 4px 8px; border-bottom: 1px solid #ddd;">₹ ${balance.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">Local:</td><td class="text-right mono" style="padding: 4px 8px; border-bottom: 1px solid #ddd;">₹ ${localExp.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">Hamali:</td><td class="text-right mono" style="padding: 4px 8px; border-bottom: 1px solid #ddd;">₹ ${hamali.toLocaleString('en-IN')}</td></tr>
              <tr style="background: #f1f5f9;"><td style="padding: 6px 8px; font-weight: 700;">Total:</td><td class="text-right mono font-bold" style="padding: 6px 8px; color: #1e3a8a;">₹ ${subTotalLeft.toLocaleString('en-IN')}</td></tr>
            </table>
          </td>

          <!-- Right Column -->
          <td style="padding: 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 3px 8px; border-bottom: 1px solid #ddd;">Commission:</td><td class="text-right mono" style="padding: 3px 8px; border-bottom: 1px solid #ddd;">₹ ${comm.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 3px 8px; border-bottom: 1px solid #ddd;">Tapal:</td><td class="text-right mono" style="padding: 3px 8px; border-bottom: 1px solid #ddd;">₹ ${tapal.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 3px 8px; border-bottom: 1px solid #ddd;">Guide:</td><td class="text-right mono" style="padding: 3px 8px; border-bottom: 1px solid #ddd;">₹ ${guide.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 3px 8px; border-bottom: 1px solid #ddd;">Crane + Godown:</td><td class="text-right mono" style="padding: 3px 8px; border-bottom: 1px solid #ddd;">₹ ${crane.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 3px 8px; border-bottom: 1px solid #ddd;">Incoming Hamali:</td><td class="text-right mono" style="padding: 3px 8px; border-bottom: 1px solid #ddd;">₹ ${inHamali.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 3px 8px; border-bottom: 1px solid #ddd;">Hand Loan:</td><td class="text-right mono" style="padding: 3px 8px; border-bottom: 1px solid #ddd;">₹ ${handLoan.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 3px 8px; border-bottom: 1px solid #ddd;">Memo Hand Loan:</td><td class="text-right mono" style="padding: 3px 8px; border-bottom: 1px solid #ddd;">₹ ${memoLoan.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 3px 8px; border-bottom: 1px solid #ddd;">Diesel:</td><td class="text-right mono font-bold" style="padding: 3px 8px; border-bottom: 1px solid #ddd; color: #b91c1c;">₹ ${diesel.toLocaleString('en-IN')}</td></tr>
              <tr style="background: #fef2f2;"><td style="padding: 6px 8px; font-weight: 800; color: #b91c1c;">TOTAL DEDUCTIONS:</td><td class="text-right mono font-bold" style="padding: 6px 8px; color: #b91c1c;">₹ ${totalDeductions.toLocaleString('en-IN')}</td></tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Legal Box (Exact Image 3) -->
      <div style="margin-top: 12px; border: 1.5px solid #000; padding: 8px 10px; font-size: 9.5px; line-height: 1.4; background: #fffbeb;">
        <b>NOTE:</b>
        <b>1)</b> ACKNOWLEDGMENT (PUNCH) IF NOT RECEIVED WITHIN 10 DAYS THE BALANCE PAYMENT WILL NOT BE PAID.
        <b>2)</b> In case any shortage is found in goods or truck meets with an accident the truck owner will make good for the loss.
        <b>3)</b> In case any goods are not delivered to the proper person or not delivered at correct address, truck owner will be responsible for the same.
        <b>4)</b> At the time of loading truck, driver should check and verify the articles; if any shortage is found, the driver will be held responsible.
      </div>

      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; padding: 0 10px;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid #000; width: 180px; padding-top: 4px; font-weight: 700; font-size: 12px;">
            Driver's Signature
          </div>
        </div>
        <div style="text-align: center;">
          <div style="border-top: 1px solid #000; width: 220px; padding-top: 4px; font-weight: 800; font-size: 13px; color: #b91c1c;">
            For ${BTS_COMPANY_INFO.name}
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(BTS_COMPANY_INFO.name, 105, 18, { align: 'center' });
    doc.setFontSize(9);
    doc.text(BTS_COMPANY_INFO.address, 105, 23, { align: 'center' });
    doc.text(`(M) ${BTS_COMPANY_INFO.phones.join(', ')}`, 105, 27, { align: 'center' });

    doc.line(15, 30, 195, 30);
    doc.setFontSize(11);
    doc.text(`MEMO NO.: ${memoNo}`, 15, 36);
    doc.text(`DATE: ${date}`, 150, 36);
    doc.line(15, 39, 195, 39);

    let y = 46;
    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'bold');
    doc.text(`From: ${data.from || 'Origin'}`, 18, y);
    doc.text(`To: ${data.to || 'Destination'}`, 110, y);
    y += 6;
    doc.text(`Truck No.: ${data.truckNo || 'Unassigned'}`, 18, y);
    doc.text(`Driver: ${data.driverName || 'Driver'} (${data.driverPhone || 'N/A'})`, 110, y);
    y += 6;
    doc.text(`Owner: ${data.ownerName || 'Fleet Owner / Carrier'}`, 18, y);
    doc.text(`Owner Add: ${data.ownerAddress || 'Transport Hub'}`, 110, y);

    y += 10;
    doc.rect(15, y, 180, 8);
    doc.text('Transporter', 18, y + 5.5);
    doc.text('Freight', 95, y + 5.5);
    doc.text('Advance', 125, y + 5.5);
    doc.text('Balance', 155, y + 5.5);
    doc.text('To Pay', 180, y + 5.5);

    y += 8;
    doc.rect(15, y, 180, 8);
    doc.setFont('Helvetica', 'normal');
    doc.text(data.transporterName || 'Freight Consignment', 18, y + 5.5);
    doc.text(`Rs. ${freight}`, 95, y + 5.5);
    doc.text(`Rs. ${advance}`, 125, y + 5.5);
    doc.text(`Rs. ${balance}`, 155, y + 5.5);
    doc.text(`Rs. ${toPay}`, 180, y + 5.5);

    // Two column box
    y += 12;
    doc.setFont('Helvetica', 'bold');
    doc.rect(15, y, 85, 45);
    doc.rect(105, y, 90, 45);
    doc.text('PAYMENT BREAKDOWN', 18, y + 6);
    doc.text('DEDUCTIONS & EXPENSES', 108, y + 6);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    let ly = y + 12;
    doc.text(`Advance: Rs. ${advance}`, 18, ly); ly += 6;
    doc.text(`Balance: Rs. ${balance}`, 18, ly); ly += 6;
    doc.text(`Local: Rs. ${localExp}`, 18, ly); ly += 6;
    doc.text(`Hamali: Rs. ${hamali}`, 18, ly); ly += 6;
    doc.setFont('Helvetica', 'bold');
    doc.text(`Total: Rs. ${subTotalLeft}`, 18, ly);

    let ry = y + 12;
    doc.setFont('Helvetica', 'normal');
    doc.text(`Commission: Rs. ${comm}`, 108, ry); ry += 5;
    doc.text(`Tapal: Rs. ${tapal} | Guide: Rs. ${guide}`, 108, ry); ry += 5;
    doc.text(`Crane + Godown: Rs. ${crane}`, 108, ry); ry += 5;
    doc.text(`Incoming Hamali: Rs. ${inHamali}`, 108, ry); ry += 5;
    doc.text(`Hand Loan / Memo Loan: Rs. ${handLoan + memoLoan}`, 108, ry); ry += 5;
    doc.setFont('Helvetica', 'bold');
    doc.text(`Diesel Advance: Rs. ${diesel}`, 108, ry); ry += 6;
    doc.text(`TOTAL DEDUCTIONS: Rs. ${totalDeductions}`, 108, ry);

    // Terms
    y += 50;
    doc.rect(15, y, 180, 22);
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.text(
      'NOTE: 1) ACKNOWLEDGMENT (PUNCH) IF NOT RECEIVED WITHIN 10 DAYS THE BALANCE PAYMENT WILL NOT BE PAID.\n2) In case any shortage is found in goods or truck meets with an accident the truck owner will make good for the loss.\n3) In case any goods are not delivered to the proper person or at correct address, truck owner will be responsible.\n4) Driver should verify the articles at loading; if shortage is found, driver will be held responsible.',
      18,
      y + 5,
      { maxWidth: 174 }
    );

    y += 32;
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text("Driver's Signature", 20, y);
    doc.text(`For ${BTS_COMPANY_INFO.name}`, 140, y);

    doc.save(`Trip-Memo-${memoNo}.pdf`);
    toast.success(`Trip Memo ${memoNo} downloaded successfully!`);
  } catch (err) {
    console.error('jsPDF generation failed, falling back to print dialog', err);
    printA4Html(html, `Trip-Memo-${memoNo}`);
  }
};

/**
 * 3. 4-COPY BILTY CONSIGNMENT NOTE (With GST SAC 9965 & RCM)
 */
export const downloadBiltyPdf = (data: {
  biltyNumber?: string;
  date?: string;
  consignorName?: string;
  consigneeName?: string;
  from?: string;
  to?: string;
  truckNo?: string;
  driverName?: string;
  packages?: number;
  goodsDescription?: string;
  weight?: string | number;
  freight?: number;
  advance?: number;
  balance?: number;
  ewayBill?: string;
  copyType?: 'Consignee' | 'Consignor' | 'Driver' | 'Transporter';
}) => {
  const biltyNo = data.biltyNumber || `BL-${new Date().getFullYear()}-0001`;
  const date = data.date || new Date().toLocaleDateString('en-IN');
  const copyType = data.copyType || 'Consignee Copy';
  const freight = data.freight || 0;
  const advance = data.advance || 0;
  const balance = data.balance || (freight - advance);

  const html = `
    <div style="border: 2px solid #000; padding: 20px; max-width: 820px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 8px;">
        <div>
          <span class="badge" style="background: #1e3a8a; color: #fff; padding: 4px 10px; font-size: 13px; font-weight: 800;">
            ${copyType.toUpperCase()}
          </span>
        </div>
        <div style="text-align: center;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: #b91c1c;">${BTS_COMPANY_INFO.name}</h2>
          <div style="font-size: 11px; font-weight: 700;">GOODS CONSIGNMENT NOTE (BILTY) — GST SAC: 9965</div>
        </div>
        <div style="text-align: right;">
          <div class="mono font-bold" style="font-size: 14px;">${biltyNo}</div>
          <div style="font-size: 11px;">Date: ${date}</div>
        </div>
      </div>

      <div style="font-size: 10px; text-align: center; margin: 6px 0; border-bottom: 1px solid #000; padding-bottom: 4px;">
        ${BTS_COMPANY_INFO.address} | Phones: ${BTS_COMPANY_INFO.phones.join(' / ')} | GSTIN: ${BTS_COMPANY_INFO.gstin}
      </div>

      <table class="table-bordered" style="margin-top: 10px; font-size: 11.5px;">
        <tr>
          <td style="width: 50%;"><b>Consignor:</b> ${data.consignorName || 'Consignor'}</td>
          <td style="width: 50%;"><b>Consignee:</b> ${data.consigneeName || 'Consignee'}</td>
        </tr>
        <tr>
          <td><b>Origin:</b> ${data.from || 'Origin'}</td>
          <td><b>Destination:</b> ${data.to || 'Destination'}</td>
        </tr>
        <tr>
          <td><b>Vehicle No:</b> <span class="mono font-bold">${data.truckNo || 'Unassigned'}</span></td>
          <td><b>Driver:</b> ${data.driverName || 'Driver'}</td>
        </tr>
        <tr>
          <td><b>E-Way Bill No:</b> <span class="mono font-bold">${data.ewayBill || 'N/A'}</span></td>
          <td><b>GST Tax Regime:</b> Reverse Charge Mechanism (RCM) Applicable</td>
        </tr>
      </table>

      <table class="table-bordered text-center" style="margin-top: 10px; font-size: 11.5px;">
        <tr style="background: #f8fafc; font-weight: 700;">
          <th>Packages</th>
          <th>Description of Goods</th>
          <th>Weight (MT)</th>
          <th>Total Freight</th>
          <th>Advance Paid</th>
          <th>Balance Payable</th>
        </tr>
        <tr>
          <td class="mono font-bold">${data.packages || 1} Units</td>
          <td>${data.goodsDescription || 'General Cargo'}</td>
          <td class="mono font-bold">${data.weight || 0} MT</td>
          <td class="mono font-bold">₹ ${freight.toLocaleString('en-IN')}</td>
          <td class="mono font-bold text-green-700">₹ ${advance.toLocaleString('en-IN')}</td>
          <td class="mono font-bold text-red-700">₹ ${balance.toLocaleString('en-IN')}</td>
        </tr>
      </table>

      <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 25px;">
        <div style="font-size: 11px;">Consignee / Driver Signature</div>
        <div style="text-align: right; font-weight: 700;">For ${BTS_COMPANY_INFO.name}</div>
      </div>
    </div>
  `;

  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(BTS_COMPANY_INFO.name, 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`CONSIGNMENT NOTE (BILTY) - ${copyType.toUpperCase()}`, 105, 24, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${BTS_COMPANY_INFO.address} | GSTIN: ${BTS_COMPANY_INFO.gstin}`, 105, 29, { align: 'center' });

    doc.line(15, 33, 195, 33);
    doc.setFont('Helvetica', 'bold');
    doc.text(`BILTY NO: ${biltyNo}`, 15, 39);
    doc.text(`DATE: ${date}`, 155, 39);
    doc.line(15, 42, 195, 42);

    let y = 50;
    doc.text(`Consignor: ${data.consignorName || 'Consignor'}`, 15, y);
    doc.text(`Consignee: ${data.consigneeName || 'Consignee'}`, 110, y);
    y += 8;
    doc.text(`From: ${data.from || 'Origin'}`, 15, y);
    doc.text(`To: ${data.to || 'Destination'}`, 110, y);
    y += 8;
    doc.text(`Truck No: ${data.truckNo || 'Unassigned'}`, 15, y);
    doc.text(`E-Way Bill: ${data.ewayBill || 'N/A'}`, 110, y);

    y += 14;
    doc.rect(15, y, 180, 20);
    doc.text(`Packages: ${data.packages || 1} Units`, 20, y + 6);
    doc.text(`Weight: ${data.weight || 0} MT`, 80, y + 6);
    doc.text(`Freight: Rs. ${freight}`, 140, y + 6);
    doc.text(`Advance: Rs. ${advance}`, 20, y + 14);
    doc.text(`Balance Payable: Rs. ${balance}`, 140, y + 14);

    y += 35;
    doc.text('Receiver / Consignee Signature', 20, y);
    doc.text(`For ${BTS_COMPANY_INFO.name}`, 140, y);

    doc.save(`Bilty-${biltyNo}-${copyType.replace(/\s+/g, '')}.pdf`);
    toast.success(`Bilty ${biltyNo} (${copyType}) downloaded!`);
  } catch (err) {
    printA4Html(html, `Bilty-${biltyNo}`);
  }
};

/**
 * 4. LORRY RECEIPT (LR) PDF
 */
export const downloadLrPdf = (data: {
  lrNumber?: string;
  date?: string;
  consignorName?: string;
  consigneeName?: string;
  origin?: string;
  destination?: string;
  vehiclePlate?: string;
  driverName?: string;
  goodsDescription?: string;
  weight?: string | number;
  freight?: number;
}) => {
  const lrNo = data.lrNumber || `LR-${new Date().getFullYear()}-0001`;
  const date = data.date || new Date().toLocaleDateString('en-IN');
  const freight = data.freight || 0;

  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(BTS_COMPANY_INFO.name, 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.text('LORRY RECEIPT (CONSIGNMENT NOTE) — INDIAN ROAD TRANSPORT', 105, 24, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`${BTS_COMPANY_INFO.address} | PAN: ${BTS_COMPANY_INFO.pan} | GSTIN: ${BTS_COMPANY_INFO.gstin}`, 105, 29, { align: 'center' });

    doc.line(15, 33, 195, 33);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`LR NO: ${lrNo}`, 15, 39);
    doc.text(`DATE: ${date}`, 155, 39);
    doc.line(15, 42, 195, 42);

    let y = 50;
    doc.text(`Consignor: ${data.consignorName || 'Consignor'}`, 15, y);
    doc.text(`Consignee: ${data.consigneeName || 'Consignee'}`, 110, y);
    y += 8;
    doc.text(`Route: ${data.origin || 'Origin'} -> ${data.destination || 'Destination'}`, 15, y);
    doc.text(`Vehicle: ${data.vehiclePlate || 'Unassigned'}`, 110, y);
    y += 8;
    doc.text(`Goods: ${data.goodsDescription || 'General Cargo'}`, 15, y);
    doc.text(`Weight: ${data.weight || '0 MT'}`, 110, y);
    y += 8;
    doc.text(`Freight Charges: Rs. ${freight.toLocaleString('en-IN')}`, 15, y);
    doc.text(`Carriage: Subject to Carriage by Road Act 2007`, 110, y);

    y += 30;
    doc.text("Transporter / Authorized Signatory", 15, y);
    doc.text("Driver Signature", 140, y);

    doc.save(`LR-${lrNo}.pdf`);
    toast.success(`LR ${lrNo} downloaded successfully!`);
  } catch (err) {
    toast.error('Could not generate PDF. Please try again.');
  }
};

/**
 * 5. CUSTOMER LEDGER STATEMENT PDF
 */
export const downloadCustomerStatementPdf = (data: {
  customerName: string;
  gstin?: string;
  totalFreight: number;
  totalAdvance: number;
  balanceDue: number;
}) => {
  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(BTS_COMPANY_INFO.name, 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.text('STATEMENT OF ACCOUNT / CUSTOMER LEDGER', 105, 25, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Customer: ${data.customerName} | GSTIN: ${data.gstin || 'N/A'}`, 105, 31, { align: 'center' });

    doc.line(15, 36, 195, 36);

    let y = 46;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Total Freight Booked: Rs. ${data.totalFreight.toLocaleString('en-IN')}`, 18, y);
    y += 8;
    doc.text(`Advances Credited: Rs. ${data.totalAdvance.toLocaleString('en-IN')}`, 18, y);
    y += 8;
    doc.text(`Net Outstanding Balance: Rs. ${data.balanceDue.toLocaleString('en-IN')}`, 18, y);

    doc.save(`Statement-${data.customerName.replace(/\s+/g, '_')}.pdf`);
    toast.success(`Customer Statement downloaded successfully!`);
  } catch (err) {
    toast.error('Could not download customer statement.');
  }
};

/**
 * 6. DELIVERY CHALLAN PDF
 */
export const downloadDeliveryChallanPdf = (data: {
  challanNumber?: string;
  orderNumber?: string;
  date?: string;
  consignorName?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  vehiclePlate?: string;
  driverName?: string;
  totalWeight?: number | string;
  totalQuantity?: number | string;
  itemDescription?: string;
}) => {
  const challanNo = data.challanNumber || `DC-${new Date().getFullYear()}-0892`;
  const date = data.date || new Date().toLocaleDateString('en-IN');

  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(BTS_COMPANY_INFO.name, 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.text('DELIVERY CHALLAN / ACKNOWLEDGEMENT NOTE', 105, 24, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`${BTS_COMPANY_INFO.address} | GSTIN: ${BTS_COMPANY_INFO.gstin}`, 105, 29, { align: 'center' });

    doc.line(15, 33, 195, 33);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`CHALLAN NO: ${challanNo}`, 15, 39);
    doc.text(`DATE: ${date}`, 155, 39);
    doc.line(15, 42, 195, 42);

    let y = 50;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Consignor: ${data.consignorName || 'Consignor'}`, 15, y);
    doc.text(`Consignee: ${data.consigneeName || 'Consignee'}`, 110, y);
    y += 8;
    doc.text(`Order / Load Ref: ${data.orderNumber || 'LD-PENDING'}`, 15, y);
    doc.text(`Destination: ${data.consigneeAddress || 'Consignee Address'}`, 110, y);
    y += 8;
    doc.text(`Vehicle No: ${data.vehiclePlate || 'Unassigned'}`, 15, y);
    doc.text(`Driver Name: ${data.driverName || 'Driver'}`, 110, y);

    y += 14;
    doc.rect(15, y, 180, 24);
    doc.text('Item Description', 20, y + 6);
    doc.text('Quantity', 110, y + 6);
    doc.text('Total Weight', 155, y + 6);

    doc.setFont('Helvetica', 'normal');
    doc.text(data.itemDescription || 'Consignment Cargo', 20, y + 16);
    doc.text(`${data.totalQuantity || 1} Pkgs`, 110, y + 16);
    doc.text(`${data.totalWeight || 0} MT`, 155, y + 16);

    y += 40;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Received the above goods in good condition & intact seal.', 15, y);

    y += 25;
    doc.setFont('Helvetica', 'bold');
    doc.text('Receiver Signature & Company Stamp', 15, y);
    doc.text(`For ${BTS_COMPANY_INFO.name}`, 145, y);

    doc.save(`Challan-${challanNo}.pdf`);
    toast.success(`Delivery Challan ${challanNo} downloaded!`);
  } catch (err) {
    toast.error('Could not generate Delivery Challan PDF.');
  }
};

/**
 * 7. TERMINAL GATE PASS PDF
 */
export const downloadGatePassPdf = (data: {
  gatePassNumber?: string;
  passType?: 'inward' | 'outward' | string;
  vehiclePlate?: string;
  driverName?: string;
  orderNumber?: string;
  securityName?: string;
  authorizedBy?: string;
  inTime?: string;
  outTime?: string;
  date?: string;
}) => {
  const passNo = data.gatePassNumber || `GP-${new Date().getFullYear()}-001`;
  const date = data.date || new Date().toLocaleDateString('en-IN');

  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(BTS_COMPANY_INFO.name, 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`SECURITY GATE PASS (${(data.passType || 'OUTWARD').toUpperCase()})`, 105, 24, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`${BTS_COMPANY_INFO.address} | Terminal Checkpost`, 105, 29, { align: 'center' });

    doc.line(15, 33, 195, 33);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`GATE PASS NO: ${passNo}`, 15, 39);
    doc.text(`DATE: ${date}`, 155, 39);
    doc.line(15, 42, 195, 42);

    let y = 52;
    doc.setFontSize(10);
    doc.text(`Vehicle Number: ${data.vehiclePlate || 'Unassigned'}`, 20, y);
    doc.text(`Driver Name: ${data.driverName || 'Driver'}`, 110, y);
    y += 10;
    doc.text(`Consignment / Load: ${data.orderNumber || 'N/A'}`, 20, y);
    doc.text(`Pass Type: ${(data.passType || 'OUTWARD').toUpperCase()}`, 110, y);
    y += 10;
    doc.text(`Security Officer: ${data.securityName || 'Duty Officer'}`, 20, y);
    doc.text(`Authorized By: ${data.authorizedBy || 'Gate In-Charge'}`, 110, y);
    y += 10;
    doc.text(`Gate In Time: ${data.inTime || 'Recorded On Gate'}`, 20, y);
    doc.text(`Gate Out Time: ${data.outTime || 'Pending Exit'}`, 110, y);

    y += 30;
    doc.rect(15, y, 180, 25);
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.text('Verification Checklist:', 20, y + 6);
    doc.text('[X] Physical Container Seal Inspected and Verified', 20, y + 12);
    doc.text('[X] E-Way Bill and Bilty physical copy verified against truck manifest', 20, y + 18);

    y += 45;
    doc.setFont('Helvetica', 'bold');
    doc.text('Security Gate Stamp', 20, y);
    doc.text('Driver Signature', 145, y);

    doc.save(`GatePass-${passNo}.pdf`);
    toast.success(`Gate Pass ${passNo} downloaded!`);
  } catch (err) {
    toast.error('Could not generate Gate Pass PDF.');
  }
};

/**
 * 8. EXCEL / CSV EXPORT UTILITY
 */
export const downloadCsv = (filename: string, rows: (string | number)[][]) => {
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success(`Exported ${filename} successfully!`);
};

/**
 * 9. PROOF OF DELIVERY (POD) CERTIFICATE PDF
 */
export const downloadPodCertificatePdf = (data: {
  loadNumber: string;
  lrNumber?: string;
  consignorName?: string;
  consigneeName?: string;
  destination?: string;
  vehiclePlate?: string;
  driverName?: string;
  receiverName?: string;
  receiverPhone?: string;
  deliveryDate?: string;
  packagesReceived?: number;
  condition?: string;
  remarks?: string;
}) => {
  const company = getActiveCompanyInfo();
  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(company.name, 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.text('PROOF OF DELIVERY (POD) & CONSIGNMENT RECEIPT CERTIFICATE', 105, 24, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`${company.address} | GSTIN: ${company.gstin}`, 105, 29, { align: 'center' });

    doc.line(15, 33, 195, 33);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`POD REF / CONSIGNMENT: ${data.loadNumber}`, 15, 39);
    doc.text(`DELIVERY DATE: ${data.deliveryDate || new Date().toLocaleDateString('en-IN')}`, 135, 39);
    doc.line(15, 42, 195, 42);

    let y = 52;
    doc.setFontSize(10);
    doc.text(`Consignor (Shipper): ${data.consignorName || 'Consignor'}`, 15, y);
    doc.text(`Consignee (Receiver): ${data.consigneeName || 'Consignee'}`, 110, y);
    y += 9;
    doc.text(`Lorry Receipt (LR) #: ${data.lrNumber || 'LR-N/A'}`, 15, y);
    doc.text(`Delivery Location: ${data.destination || 'Unloading Yard'}`, 110, y);
    y += 9;
    doc.text(`Transport Truck: ${data.vehiclePlate || 'Unassigned'}`, 15, y);
    doc.text(`Commercial Driver: ${data.driverName || 'Driver'}`, 110, y);

    y += 16;
    doc.rect(15, y, 180, 48);
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('OFFICIAL RECEIVER DELIVERY ACKNOWLEDGMENT & INSPECTION', 20, y + 6);

    y += 14;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Received By: ${data.receiverName || 'Authorized Receiving Supervisor'}`, 20, y);
    doc.text(`Receiver Phone: ${data.receiverPhone || '+91 - Verified'}`, 110, y);
    y += 8;
    doc.text(`Cargo Condition: ${data.condition || 'Received in sound & undamaged condition'}`, 20, y);
    doc.text(`Packages Count: ${data.packagesReceived || 'Full Consignment'}`, 110, y);
    y += 8;
    doc.text(`Delivery Remarks / Notes: ${data.remarks || 'Material unloaded and physical inspection completed.'}`, 20, y);

    y += 30;
    doc.rect(15, y, 180, 26);
    doc.setFont('Helvetica', 'bold');
    doc.text('DELIVERY VERIFICATION STATUS: VERIFIED & COMPLETED', 20, y + 7);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('This document certifies that the consignment specified above was formally received and accepted', 20, y + 14);
    doc.text('by the consignee. Freight billing and invoice clearance authorized under transport terms.', 20, y + 20);

    y += 45;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Receiver Official Stamp & Signature', 20, y);
    doc.text(`For ${company.name}`, 140, y);

    doc.save(`POD-Certificate-${data.loadNumber}.pdf`);
    toast.success(`POD Certificate for ${data.loadNumber} downloaded!`);
  } catch (err) {
    toast.error('Could not generate POD Certificate PDF.');
  }
};


