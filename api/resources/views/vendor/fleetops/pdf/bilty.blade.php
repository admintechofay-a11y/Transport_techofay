<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bilty - {{ $bilty->bilty_number }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #222; margin: 0; padding: 10px; }
        .box { border: 1px solid #777; margin-bottom: 8px; }
        .box-header { background: #f0f0f0; border-bottom: 1px solid #777; padding: 4px 6px; font-weight: bold; font-size: 10px; }
        .box-content { padding: 6px; }
        table.data { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 8px; }
        table.data th, table.data td { border: 1px solid #999; padding: 5px; text-align: left; }
        table.data th { background: #f5f5f5; font-weight: bold; }
        .amount-row { font-weight: bold; }
    </style>
</head>
<body>
    @include('fleetops::pdf._header', ['title' => 'CONSIGNMENT NOTE / BILTY', 'date' => !empty($bilty->bilty_date) ? ($bilty->bilty_date instanceof \DateTimeInterface ? $bilty->bilty_date->format('d-m-Y') : $bilty->bilty_date) : date('d-m-Y')])

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">BILTY INFORMATION</div>
                    <div class="box-content">
                        <strong>Bilty No:</strong> <span style="font-size: 12px; font-weight: bold; color: #0284c7;">{{ $bilty->bilty_number }}</span><br>
                        <strong>LR Number:</strong> {{ $bilty->lrNumber?->lr_number ?? 'N/A' }}<br>
                        <strong>Bilty Date:</strong> {{ !empty($bilty->bilty_date) ? ($bilty->bilty_date instanceof \DateTimeInterface ? $bilty->bilty_date->format('d-m-Y') : $bilty->bilty_date) : date('d-m-Y') }}<br>
                        <strong>Payment Terms:</strong> <span style="text-transform: uppercase; font-weight: bold; color: #b91c1c;">{{ str_replace('_', ' ', $bilty->payment_terms ?? 'to_pay') }}</span>
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">CARRIER DETAILS</div>
                    <div class="box-content">
                        <strong>Vehicle No:</strong> {{ $bilty->vehicle?->plate_number ?? 'Unassigned' }}<br>
                        <strong>Driver:</strong> {{ $bilty->driver?->name ?? 'Unassigned' }}<br>
                        <strong>Driver Contact:</strong> {{ $bilty->driver?->phone ?? 'N/A' }}<br>
                        <strong>Authorized By:</strong> {{ $bilty->authorized_by ?? 'Traffic Manager' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">CONSIGNOR (DISPATCHED FROM)</div>
                    <div class="box-content" style="min-height: 50px;">
                        <strong>{{ $bilty->consignor?->name ?? ($bilty->customer?->name ?? 'N/A') }}</strong><br>
                        {{ $bilty->consignor?->billing_address ?? ($bilty->consignor?->address ?? 'N/A') }}<br>
                        <strong>GSTIN:</strong> {{ $bilty->consignor?->gstin ?? 'N/A' }}
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">CONSIGNEE (DELIVER TO)</div>
                    <div class="box-content" style="min-height: 50px;">
                        <strong>{{ $bilty->consignee?->name ?? 'N/A' }}</strong><br>
                        {{ $bilty->consignee?->delivery_address ?? ($bilty->consignee?->address ?? 'N/A') }}<br>
                        <strong>GSTIN:</strong> {{ $bilty->consignee?->gstin ?? 'N/A' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="box">
        <div class="box-content">
            <strong>From:</strong> {{ $bilty->from_location ?? 'Origin' }} &nbsp;&nbsp;&nbsp;&nbsp;
            <strong>To:</strong> {{ $bilty->to_location ?? 'Destination' }} &nbsp;&nbsp;&nbsp;&nbsp;
            <strong>Total Weight:</strong> {{ !empty($bilty->total_weight) ? $bilty->total_weight . ' MT' : 'As per invoice' }}
        </div>
    </div>

    <table class="data">
        <thead>
            <tr>
                <th style="width: 8%;">S.No</th>
                <th style="width: 47%;">Description of Goods / Packaging</th>
                <th style="width: 15%;">Quantity / Unit</th>
                <th style="width: 15%;">Weight (MT)</th>
                <th style="width: 15%;">Rate (INR)</th>
            </tr>
        </thead>
        <tbody>
            @if(!empty($bilty->material_details))
                @foreach($bilty->material_details as $i => $item)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $item['material'] ?? ($item['description'] ?? 'General Cargo') }}</td>
                    <td>{{ $item['quantity'] ?? '-' }} {{ $item['unit'] ?? '' }}</td>
                    <td>{{ $item['weight'] ?? '-' }}</td>
                    <td>{{ isset($item['rate']) ? '₹ ' . number_format($item['rate'], 2) : '-' }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td>1</td>
                    <td>Industrial Transport Consignment</td>
                    <td>1 Lot</td>
                    <td>{{ $bilty->total_weight ?? '-' }}</td>
                    <td>-</td>
                </tr>
            @endif
        </tbody>
    </table>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 55%; vertical-align: top; padding-right: 8px;">
                <div class="box" style="height: 100px;">
                    <div class="box-header">SPECIAL INSTRUCTIONS / REMARKS</div>
                    <div class="box-content">
                        {{ $bilty->remarks ?? 'No special instructions. Material received in good condition for transit.' }}
                    </div>
                </div>
            </td>
            <td style="width: 45%; vertical-align: top;">
                <table class="data" style="margin-top: 0;">
                    <tr>
                        <td style="width: 60%;"><strong>Total Freight:</strong></td>
                        <td style="text-align: right;">₹ {{ number_format((float)($bilty->freight_amount ?? 0), 2) }}</td>
                    </tr>
                    <tr>
                        <td><strong>Advance Paid:</strong></td>
                        <td style="text-align: right;">₹ {{ number_format((float)($bilty->advance_amount ?? 0), 2) }}</td>
                    </tr>
                    <tr class="amount-row" style="background: #fdf2f2;">
                        <td><strong>Balance Payable:</strong></td>
                        <td style="text-align: right; color: #b91c1c;">₹ {{ number_format((float)($bilty->balance_amount ?? 0), 2) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @include('fleetops::pdf._footer')
</body>
</html>
