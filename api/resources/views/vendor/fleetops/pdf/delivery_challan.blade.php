<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Delivery Challan - {{ $challan->challan_number }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #222; margin: 0; padding: 10px; }
        .box { border: 1px solid #777; margin-bottom: 8px; }
        .box-header { background: #f0f0f0; border-bottom: 1px solid #777; padding: 4px 6px; font-weight: bold; font-size: 10px; }
        .box-content { padding: 6px; }
        table.data { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 8px; }
        table.data th, table.data td { border: 1px solid #999; padding: 5px; text-align: left; }
        table.data th { background: #f5f5f5; font-weight: bold; }
    </style>
</head>
<body>
    @include('fleetops::pdf._header', ['title' => 'DELIVERY CHALLAN', 'date' => $challan->challan_date?->format('d-m-Y') ?? date('d-m-Y')])

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">CHALLAN INFORMATION</div>
                    <div class="box-content">
                        <strong>Challan No:</strong> <span style="font-size: 12px; font-weight: bold; color: #0284c7;">{{ $challan->challan_number }}</span><br>
                        <strong>Date:</strong> {{ $challan->challan_date?->format('d-m-Y') ?? date('d-m-Y') }}<br>
                        <strong>Load Ref:</strong> {{ $challan->load?->load_number ?? $challan->load_uuid }}<br>
                        <strong>Status:</strong> <span style="text-transform: uppercase;">{{ $challan->status }}</span>
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">DISPATCH & CARRIER</div>
                    <div class="box-content">
                        <strong>Vehicle Reg No:</strong> {{ $challan->vehicle?->plate_number ?? 'Unassigned' }}<br>
                        <strong>Driver:</strong> {{ $challan->driver?->name ?? 'Unassigned' }}<br>
                        <strong>Driver Contact:</strong> {{ $challan->driver?->phone ?? 'N/A' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="box">
        <div class="box-header">CONSIGNEE / DELIVERED TO</div>
        <div class="box-content">
            <strong>{{ $challan->consignee?->name ?? 'Consignee on record' }}</strong><br>
            {{ $challan->consignee?->delivery_address ?? ($challan->consignee?->address ?? 'Destination Address') }}<br>
            <strong>GSTIN:</strong> {{ $challan->consignee?->gstin ?? 'N/A' }} | <strong>Phone:</strong> {{ $challan->consignee?->phone ?? 'N/A' }}
        </div>
    </div>

    <table class="data">
        <thead>
            <tr>
                <th style="width: 8%;">S.No</th>
                <th style="width: 52%;">Material / Item Description</th>
                <th style="width: 20%;">Delivered Qty / Unit</th>
                <th style="width: 20%;">Total Weight</th>
            </tr>
        </thead>
        <tbody>
            @if(!empty($challan->material_items))
                @foreach($challan->material_items as $i => $item)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $item['material'] ?? ($item['description'] ?? 'Cargo') }}</td>
                    <td>{{ $item['quantity'] ?? '-' }} {{ $item['unit'] ?? '' }}</td>
                    <td>{{ $item['weight'] ?? '-' }} MT/Kg</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td>1</td>
                    <td>Commercial Goods Consignment</td>
                    <td>{{ $challan->total_quantity ?? '1 Lot' }}</td>
                    <td>{{ $challan->total_weight ? $challan->total_weight . ' MT' : '-' }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    <div class="box" style="margin-top: 15px;">
        <div class="box-header">ACKNOWLEDGMENT OF RECEIPT</div>
        <div class="box-content" style="min-height: 70px;">
            <p style="margin: 0 0 15px 0;">Received the above material in good condition and correct quantity without shortage or damage.</p>
            <table style="width: 100%;">
                <tr>
                    <td style="width: 50%;">
                        <strong>Received By (Name):</strong> {{ $challan->received_by ?? '_________________________' }}<br>
                        <strong>Date & Time:</strong> {{ $challan->delivered_at?->format('d-m-Y H:i') ?? '_________________________' }}
                    </td>
                    <td style="width: 50%; text-align: right; vertical-align: bottom;">
                        <strong>Receiver's Signature & Stamp</strong>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    @include('fleetops::pdf._footer')
</body>
</html>
