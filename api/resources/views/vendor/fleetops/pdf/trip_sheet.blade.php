<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Trip Sheet - {{ $order->load_number ?? $order->public_id }}</title>
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
    @include('fleetops::pdf._header', ['title' => 'DRIVER TRIP SHEET / LOG', 'date' => date('d-m-Y')])

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">TRIP & LOAD DETAILS</div>
                    <div class="box-content">
                        <strong>Trip / Load No:</strong> <span style="font-size: 12px; font-weight: bold; color: #0284c7;">{{ $order->load_number ?? $order->public_id }}</span><br>
                        <strong>Customer:</strong> {{ $order->customer?->name ?? 'N/A' }}<br>
                        <strong>Dispatch Date:</strong> {{ !empty($order->dispatched_at) ? ($order->dispatched_at instanceof \DateTimeInterface ? $order->dispatched_at->format('d-m-Y H:i') : $order->dispatched_at) : date('d-m-Y') }}<br>
                        <strong>Est. Distance:</strong> {{ !empty($order->distance) ? round($order->distance / 1000, 1) . ' km' : 'N/A' }}
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">VEHICLE & DRIVER ASSIGNMENT</div>
                    <div class="box-content">
                        <strong>Vehicle Reg No:</strong> {{ $order->vehicleAssigned?->plate_number ?? 'Unassigned' }}<br>
                        <strong>Driver Name:</strong> {{ $order->driverAssigned?->name ?? 'Unassigned' }}<br>
                        <strong>Driver Contact:</strong> {{ $order->driverAssigned?->phone ?? 'N/A' }}<br>
                        <strong>License No:</strong> {{ $order->driverAssigned?->drivers_license_number ?? 'N/A' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="box">
        <div class="box-header">ROUTE WAYPOINTS & STOP LOG</div>
        <div class="box-content">
            <table class="data">
                <thead>
                    <tr>
                        <th style="width: 8%;">Stop</th>
                        <th style="width: 35%;">Location / Place</th>
                        <th style="width: 17%;">Type</th>
                        <th style="width: 20%;">Arrival Time</th>
                        <th style="width: 20%;">Departure Time</th>
                    </tr>
                </thead>
                <tbody>
                    @if($order->payload && $order->payload->waypoints && $order->payload->waypoints->count())
                        @foreach($order->payload->waypoints as $idx => $wp)
                        <tr>
                            <td>{{ $idx + 1 }}</td>
                            <td>{{ $wp->place?->name ?? ($wp->place?->address ?? 'Waypoint') }}</td>
                            <td>{{ strtoupper($wp->type ?? 'STOP') }}</td>
                            <td>{{ $wp->status === 'completed' ? 'Done' : 'Pending' }}</td>
                            <td>-</td>
                        </tr>
                        @endforeach
                    @else
                        <tr>
                            <td>1</td>
                            <td>{{ $order->payload?->pickup?->name ?? 'Pickup Point' }}</td>
                            <td>PICKUP</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>{{ $order->payload?->dropoff?->name ?? 'Delivery Point' }}</td>
                            <td>DELIVERY</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>

    <div class="box">
        <div class="box-header">ODOMETER & EXPENSE SUMMARY</div>
        <div class="box-content">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 33%;"><strong>Start KM:</strong> ______________</td>
                    <td style="width: 33%;"><strong>Closing KM:</strong> ______________</td>
                    <td style="width: 33%;"><strong>Total KM:</strong> ______________</td>
                </tr>
                <tr>
                    <td style="padding-top: 8px;"><strong>Diesel Advance:</strong> ₹ ________</td>
                    <td style="padding-top: 8px;"><strong>Toll Advance:</strong> ₹ ________</td>
                    <td style="padding-top: 8px;"><strong>Driver Allowance:</strong> ₹ ________</td>
                </tr>
            </table>
        </div>
    </div>

    @include('fleetops::pdf._footer')
</body>
</html>
