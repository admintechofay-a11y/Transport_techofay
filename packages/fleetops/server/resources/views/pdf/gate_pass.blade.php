<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Gate Pass - {{ $gatePass->gate_pass_number }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #222; margin: 0; padding: 10px; }
        .box { border: 1px solid #777; margin-bottom: 8px; }
        .box-header { background: #f0f0f0; border-bottom: 1px solid #777; padding: 4px 6px; font-weight: bold; font-size: 10px; }
        .box-content { padding: 6px; }
    </style>
</head>
<body>
    @include('fleetops::pdf._header', ['title' => 'SECURITY GATE PASS (' . strtoupper($gatePass->pass_type) . ')', 'date' => date('d-m-Y')])

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">PASS DETAILS</div>
                    <div class="box-content">
                        <strong>Pass Number:</strong> <span style="font-size: 12px; font-weight: bold; color: #0284c7;">{{ $gatePass->gate_pass_number }}</span><br>
                        <strong>Movement Type:</strong> <span style="font-weight: bold; text-transform: uppercase;">{{ $gatePass->pass_type }} BOUND</span><br>
                        <strong>In Time:</strong> {{ $gatePass->in_time?->format('d-m-Y H:i:s') ?? 'N/A' }}<br>
                        <strong>Out Time:</strong> {{ $gatePass->out_time?->format('d-m-Y H:i:s') ?? 'N/A' }}
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">VEHICLE & DRIVER</div>
                    <div class="box-content">
                        <strong>Vehicle Reg No:</strong> {{ $gatePass->vehicle?->plate_number ?? 'Unassigned' }}<br>
                        <strong>Driver Name:</strong> {{ $gatePass->driver?->name ?? 'Unassigned' }}<br>
                        <strong>Driver Phone:</strong> {{ $gatePass->driver?->phone ?? 'N/A' }}<br>
                        <strong>Linked Load:</strong> {{ $gatePass->load?->load_number ?? ($gatePass->load_uuid ?? 'N/A') }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="box">
        <div class="box-header">AUTHORIZATION & SECURITY VERIFICATION</div>
        <div class="box-content" style="min-height: 80px;">
            <p style="margin: 0 0 10px 0;"><strong>Remarks:</strong> {{ $gatePass->remarks ?? 'Inspected vehicle and cargo. Permission granted for entry/exit.' }}</p>
            <table style="width: 100%; margin-top: 30px;">
                <tr>
                    <td style="width: 50%;">
                        <strong>Authorized By:</strong> {{ $gatePass->authorized_by ?? 'Traffic Manager' }}<br>
                        <span style="font-size: 9px; color: #666;">(Signature of Dispatch Authority)</span>
                    </td>
                    <td style="width: 50%; text-align: right;">
                        <strong>Security Officer:</strong> {{ $gatePass->security_name ?? 'Gate Security' }}<br>
                        <span style="font-size: 9px; color: #666;">(Security Stamp & Signature)</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    @include('fleetops::pdf._footer')
</body>
</html>
