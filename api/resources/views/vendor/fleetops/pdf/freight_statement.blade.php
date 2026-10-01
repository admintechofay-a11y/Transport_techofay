<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Freight Statement - {{ $charge->public_id }}</title>
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
    @include('fleetops::pdf._header', ['title' => 'FREIGHT CHARGES STATEMENT', 'date' => date('d-m-Y')])

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">BILL TO CUSTOMER</div>
                    <div class="box-content">
                        <strong>{{ $charge->customer?->name ?? 'Direct Customer' }}</strong><br>
                        {{ $charge->customer?->billing_address ?? ($charge->customer?->address ?? 'Address on file') }}<br>
                        <strong>GSTIN:</strong> {{ $charge->customer?->gstin ?? 'N/A' }} | <strong>PAN:</strong> {{ $charge->customer?->pan_number ?? 'N/A' }}
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">LOAD & STATEMENT REF</div>
                    <div class="box-content">
                        <strong>Statement ID:</strong> {{ $charge->public_id }}<br>
                        <strong>Load No:</strong> {{ $charge->load?->load_number ?? $charge->load_uuid }}<br>
                        <strong>Payment Status:</strong> <span style="font-weight: bold; text-transform: uppercase; color: {{ $charge->payment_status === 'paid' ? '#15803d' : '#b91c1c' }};">{{ $charge->payment_status }}</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                <th style="width: 10%;">#</th>
                <th style="width: 60%;">Description of Charge</th>
                <th style="width: 30%; text-align: right;">Amount (INR)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>Base Freight Amount</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->freight_amount, 2) }}</td>
            </tr>
            @if((float)$charge->loading_charges > 0)
            <tr>
                <td>2</td>
                <td>Loading Charges</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->loading_charges, 2) }}</td>
            </tr>
            @endif
            @if((float)$charge->unloading_charges > 0)
            <tr>
                <td>3</td>
                <td>Unloading / Hamali Charges</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->unloading_charges, 2) }}</td>
            </tr>
            @endif
            @if((float)$charge->detention_charges > 0)
            <tr>
                <td>4</td>
                <td>Detention / Halting Charges</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->detention_charges, 2) }}</td>
            </tr>
            @endif
            @if((float)$charge->toll_charges > 0)
            <tr>
                <td>5</td>
                <td>Toll / Border Tax Charges</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->toll_charges, 2) }}</td>
            </tr>
            @endif
            @if((float)$charge->handling_charges > 0)
            <tr>
                <td>6</td>
                <td>Handling / Crossing Charges</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->handling_charges, 2) }}</td>
            </tr>
            @endif
            @if((float)$charge->miscellaneous_charges > 0)
            <tr>
                <td>7</td>
                <td>Miscellaneous Charges</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->miscellaneous_charges, 2) }}</td>
            </tr>
            @endif
            @if(!empty($charge->additional_charges))
                @foreach($charge->additional_charges as $add)
                <tr>
                    <td>*</td>
                    <td>{{ $add['label'] ?? 'Custom Charge' }}</td>
                    <td style="text-align: right;">₹ {{ number_format((float)($add['amount'] ?? 0), 2) }}</td>
                </tr>
                @endforeach
            @endif
            <tr class="total-row" style="background: #e5e7eb; font-size: 11px;">
                <td colspan="2" style="text-align: right;">Total Gross Charges:</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->total_charges, 2) }}</td>
            </tr>
            <tr>
                <td colspan="2" style="text-align: right; color: #166534;">Less: Advance Received:</td>
                <td style="text-align: right; color: #166534;">(-) ₹ {{ number_format((float)$charge->advance_paid, 2) }}</td>
            </tr>
            @if((float)$charge->deductions > 0)
            <tr>
                <td colspan="2" style="text-align: right; color: #991b1b;">Less: Deductions / Shortage ({{ $charge->deduction_remarks ?? 'Penalty' }}):</td>
                <td style="text-align: right; color: #991b1b;">(-) ₹ {{ number_format((float)$charge->deductions, 2) }}</td>
            </tr>
            @endif
            <tr class="total-row" style="background: #fee2e2; font-size: 12px; color: #991b1b;">
                <td colspan="2" style="text-align: right;">Net Balance Payable:</td>
                <td style="text-align: right;">₹ {{ number_format((float)$charge->balance_payable, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div style="font-size: 9px; margin-top: 10px;">
        <strong>Remarks:</strong> {{ $charge->remarks ?? 'Please settle the balance within payment term days.' }}
    </div>

    @include('fleetops::pdf._footer')
</body>
</html>
