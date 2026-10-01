<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tax Invoice - {{ $charge->public_id }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #222; margin: 0; padding: 10px; }
        .box { border: 1px solid #777; margin-bottom: 8px; }
        .box-header { background: #f0f0f0; border-bottom: 1px solid #777; padding: 4px 6px; font-weight: bold; font-size: 10px; }
        .box-content { padding: 6px; }
        table.data { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 8px; }
        table.data th, table.data td { border: 1px solid #999; padding: 5px; text-align: left; }
        table.data th { background: #f5f5f5; font-weight: bold; }
        .total-row { font-weight: bold; background: #fafafa; }
    </style>
</head>
<body>
    @include('fleetops::pdf._header', ['title' => 'TAX INVOICE (TRANSPORT SERVICE)', 'date' => date('d-m-Y')])

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">DETAILS OF RECIPIENT / BILLED TO</div>
                    <div class="box-content">
                        <strong>{{ $charge->customer?->name ?? 'Consignee / Client' }}</strong><br>
                        {{ $charge->customer?->billing_address ?? ($charge->customer?->address ?? 'Address on file') }}<br>
                        <strong>City:</strong> {{ $charge->customer?->billing_city ?? '-' }} | <strong>State:</strong> {{ $charge->customer?->billing_state ?? '-' }}<br>
                        <strong>GSTIN:</strong> {{ $charge->customer?->gstin ?? 'UNREGISTERED' }} | <strong>PAN:</strong> {{ $charge->customer?->pan_number ?? 'N/A' }}
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">INVOICE & LOAD REFERENCES</div>
                    <div class="box-content">
                        <strong>Invoice No:</strong> <span style="font-size: 11px; font-weight: bold; color: #0284c7;">INV-{{ date('Y') }}-{{ substr($charge->public_id, -6) }}</span><br>
                        <strong>Invoice Date:</strong> {{ date('d-m-Y') }}<br>
                        <strong>Load / Consignment No:</strong> {{ $charge->load?->load_number ?? $charge->load_uuid }}<br>
                        <strong>Reverse Charge (RCM):</strong> Yes (Applicable under GTA)
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                <th style="width: 8%;">S.No</th>
                <th style="width: 44%;">Description of Service</th>
                <th style="width: 14%;">SAC Code</th>
                <th style="width: 14%;">GST Rate</th>
                <th style="width: 20%; text-align: right;">Taxable Amount (INR)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>Road Freight & Logistics Service for Load {{ $charge->load?->load_number ?? '' }}</td>
                <td>996511</td>
                <td>5% (RCM)</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->freight_amount, 2) }}</td>
            </tr>
            @if((float)$charge->loading_charges + (float)$charge->unloading_charges > 0)
            <tr>
                <td>2</td>
                <td>Loading & Unloading Hamali Charges</td>
                <td>996511</td>
                <td>5% (RCM)</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->loading_charges + (float)$charge->unloading_charges, 2) }}</td>
            </tr>
            @endif
            @if((float)$charge->toll_charges > 0)
            <tr>
                <td>3</td>
                <td>Toll & Crossing Charges (Reimbursement)</td>
                <td>996511</td>
                <td>Exempt</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->toll_charges, 2) }}</td>
            </tr>
            @endif
            <tr class="total-row" style="background: #e5e7eb; font-size: 11px;">
                <td colspan="4" style="text-align: right;">Total Invoice Amount:</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->total_charges, 2) }}</td>
            </tr>
            <tr>
                <td colspan="4" style="text-align: right; color: #166534;">Less Advance Paid:</td>
                <td style="text-align: right; color: #166534;">(-) ₹ {{ number_format((float)$charge->advance_paid, 2) }}</td>
            </tr>
            <tr class="total-row" style="background: #fee2e2; font-size: 12px; color: #991b1b;">
                <td colspan="4" style="text-align: right;">Amount Due / Balance:</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->balance_payable, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div style="font-size: 9px; margin-top: 8px; border: 1px solid #ddd; padding: 6px; background: #fafafa;">
        <strong>GST Note:</strong> In terms of Notification No. 13/2017-Central Tax (Rate), GST on Goods Transport Agency (GTA) service is payable by the recipient under Reverse Charge Mechanism (RCM).
    </div>

    @include('fleetops::pdf._footer')
</body>
</html>
