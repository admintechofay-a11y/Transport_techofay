<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Loading Slip - {{ $order->load_number ?? $order->public_id }}</title>
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
    @include('fleetops::pdf._header', ['title' => 'LOADING SLIP / DISPATCH ADVICE', 'date' => date('d-m-Y')])

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">LOAD DETAILS</div>
                    <div class="box-content">
                        <strong>Load Number:</strong> <span style="font-size: 12px; font-weight: bold; color: #0284c7;">{{ $order->load_number ?? $order->public_id }}</span><br>
                        <strong>Order Ref:</strong> {{ $order->internal_id ?? $order->public_id }}<br>
                        <strong>Customer:</strong> {{ $order->customer?->name ?? 'N/A' }}<br>
                        <strong>Status:</strong> <span style="text-transform: uppercase;">{{ str_replace('_', ' ', $order->status) }}</span>
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">ASSIGNED VEHICLE & CREW</div>
                    <div class="box-content">
                        <strong>Vehicle Reg No:</strong> {{ $order->vehicleAssigned?->plate_number ?? 'Unassigned' }}<br>
                        <strong>Driver Name:</strong> {{ $order->driverAssigned?->name ?? 'Unassigned' }}<br>
                        <strong>Driver Phone:</strong> {{ $order->driverAssigned?->phone ?? 'N/A' }}<br>
                        <strong>License No:</strong> {{ $order->driverAssigned?->drivers_license_number ?? 'N/A' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="box">
        <div class="box-header">PICKUP & DELIVERY LOCATIONS</div>
        <div class="box-content">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 50%; vertical-align: top;">
                        <strong>Loading Point (Pickup):</strong><br>
                        {{ $order->payload?->pickup?->name ?? 'Origin' }}<br>
                        {{ $order->payload?->pickup?->address ?? '' }}
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                        <strong>Unloading Point (Drop):</strong><br>
                        {{ $order->payload?->dropoff?->name ?? 'Destination' }}<br>
                        {{ $order->payload?->dropoff?->address ?? '' }}
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="box">
        <div class="box-header">MATERIALS TO LOAD</div>
        <div class="box-content">
            <table class="data">
                <thead>
                    <tr>
                        <th style="width: 10%;">#</th>
                        <th style="width: 50%;">Material / Description</th>
                        <th style="width: 20%;">Qty / Unit</th>
                        <th style="width: 20%;">Declared Weight</th>
                    </tr>
                </thead>
                <tbody>
                    @if($order->payload && $order->payload->entities && $order->payload->entities->count())
                        @foreach($order->payload->entities as $idx => $entity)
                        <tr>
                            <td>{{ $idx + 1 }}</td>
                            <td>{{ $entity->name ?? 'Cargo item' }}</td>
                            <td>{{ $entity->length ?? '1' }} Units</td>
                            <td>{{ $entity->weight ?? '-' }} {{ $entity->weight_unit ?? 'Kg' }}</td>
                        </tr>
                        @endforeach
                    @else
                        <tr>
                            <td>1</td>
                            <td>Standard Freight / Commercial Goods</td>
                            <td>1 Load</td>
                            <td>-</td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
            <td style="width: 33%; text-align: center; border-top: 1px dashed #666; padding-top: 5px;">
                Loading In-charge
            </td>
            <td style="width: 33%; text-align: center; border-top: 1px dashed #666; padding-top: 5px;">
                Driver Signature
            </td>
            <td style="width: 33%; text-align: center; border-top: 1px dashed #666; padding-top: 5px;">
                Security Gate Out
            </td>
        </tr>
    </table>

    @include('fleetops::pdf._footer')
</body>
</html>
