<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Lorry Receipt - {{ $lr->lr_number }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #222; margin: 0; padding: 10px; }
        .box { border: 1px solid #777; margin-bottom: 8px; }
        .box-header { background: #f0f0f0; border-bottom: 1px solid #777; padding: 4px 6px; font-weight: bold; font-size: 10px; }
        .box-content { padding: 6px; }
        table.data { width: 100%; border-collapse: collapse; margin-top: 4px; }
        table.data th, table.data td { border: 1px solid #999; padding: 5px; text-align: left; }
        table.data th { background: #f5f5f5; font-weight: bold; }
    </style>
</head>
<body>
    @include('fleetops::pdf._header', ['title' => 'LORRY RECEIPT (CONSIGNMENT NOTE)', 'date' => !empty($lr->lr_date) ? ($lr->lr_date instanceof \DateTimeInterface ? $lr->lr_date->format('d-m-Y') : $lr->lr_date) : date('d-m-Y')])

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">LR INFORMATION</div>
                    <div class="box-content">
                        <strong>LR Number:</strong> <span style="font-size: 12px; font-weight: bold; color: #0284c7;">{{ $lr->lr_number }}</span><br>
                        <strong>Date:</strong> {{ !empty($lr->lr_date) ? ($lr->lr_date instanceof \DateTimeInterface ? $lr->lr_date->format('d-m-Y') : $lr->lr_date) : date('d-m-Y') }}<br>
                        <strong>Status:</strong> <span style="text-transform: uppercase;">{{ str_replace('_', ' ', $lr->status ?? 'issued') }}</span><br>
                        <strong>Generation Mode:</strong> {{ strtoupper($lr->generation_mode ?? 'system') }}
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">VEHICLE & DRIVER</div>
                    <div class="box-content">
                        <strong>Vehicle No:</strong> {{ $lr->vehicle?->plate_number ?? 'Unassigned' }}<br>
                        <strong>Driver Name:</strong> {{ $lr->driver?->name ?? 'Unassigned' }}<br>
                        <strong>Driver Phone:</strong> {{ $lr->driver?->phone ?? 'N/A' }}<br>
                        <strong>License No:</strong> {{ $lr->driver?->drivers_license_number ?? 'N/A' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">CONSIGNOR (SENDER)</div>
                    <div class="box-content" style="min-height: 55px;">
                        <strong>{{ $lr->consignor?->name ?? ($lr->customer?->name ?? 'N/A') }}</strong><br>
                        {{ $lr->consignor?->billing_address ?? ($lr->consignor?->address ?? 'Address on file') }}<br>
                        <strong>GSTIN:</strong> {{ $lr->consignor?->gstin ?? 'N/A' }} | <strong>Phone:</strong> {{ $lr->consignor?->phone ?? 'N/A' }}
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">CONSIGNEE (RECEIVER)</div>
                    <div class="box-content" style="min-height: 55px;">
                        <strong>{{ $lr->consignee?->name ?? 'N/A' }}</strong><br>
                        {{ $lr->consignee?->delivery_address ?? ($lr->consignee?->address ?? 'Address on file') }}<br>
                        <strong>GSTIN:</strong> {{ $lr->consignee?->gstin ?? 'N/A' }} | <strong>Phone:</strong> {{ $lr->consignee?->phone ?? 'N/A' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="box">
        <div class="box-header">ROUTE DETAILS</div>
        <div class="box-content">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 50%;"><strong>From (Source):</strong> {{ $lr->from_location ?? 'Origin' }}</td>
                    <td style="width: 50%;"><strong>To (Destination):</strong> {{ $lr->to_location ?? 'Destination' }}</td>
                </tr>
            </table>
        </div>
    </div>

    @if(!empty($lr->bilty) && !empty($lr->bilty->material_details))
    <table class="data">
        <thead>
            <tr>
                <th style="width: 8%;">S.No</th>
                <th style="width: 45%;">Description of Goods / Material</th>
                <th style="width: 15%;">Quantity / Unit</th>
                <th style="width: 16%;">Actual Weight</th>
                <th style="width: 16%;">Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($lr->bilty->material_details as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $item['material'] ?? ($item['description'] ?? 'General Cargo') }}</td>
                <td>{{ $item['quantity'] ?? '-' }} {{ $item['unit'] ?? '' }}</td>
                <td>{{ $item['weight'] ?? '-' }} MT/Kg</td>
                <td>{{ $item['remarks'] ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <table class="data">
        <thead>
            <tr>
                <th>Item / Description</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>General Transport Consignment</td>
                <td>{{ $lr->remarks ?? 'Carried as per standard haulage terms' }}</td>
            </tr>
        </tbody>
    </table>
    @endif

    @include('fleetops::pdf._footer')
</body>
</html>
