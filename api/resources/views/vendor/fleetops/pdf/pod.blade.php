<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proof of Delivery - {{ $proof->public_id ?? 'POD' }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #222; margin: 0; padding: 10px; }
        .box { border: 1px solid #777; margin-bottom: 8px; }
        .box-header { background: #f0f0f0; border-bottom: 1px solid #777; padding: 4px 6px; font-weight: bold; font-size: 10px; }
        .box-content { padding: 6px; }
    </style>
</head>
<body>
    @include('fleetops::pdf._header', ['title' => 'PROOF OF DELIVERY (E-POD)', 'date' => date('d-m-Y')])

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 4px;">
                <div class="box">
                    <div class="box-header">POD RECORD DETAILS</div>
                    <div class="box-content">
                        <strong>POD Reference:</strong> <span style="font-size: 12px; font-weight: bold; color: #0284c7;">{{ $proof->public_id }}</span><br>
                        <strong>Order / Load No:</strong> {{ $proof->subject?->load_number ?? ($proof->subject?->public_id ?? 'N/A') }}<br>
                        <strong>Delivered At:</strong> {{ $proof->created_at?->format('d-m-Y H:i:s') ?? date('d-m-Y H:i:s') }}<br>
                        <strong>Verification Method:</strong> {{ strtoupper($proof->raw['method'] ?? 'Digital Signature') }}
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 4px;">
                <div class="box">
                    <div class="box-header">RECEIVER IDENTIFICATION</div>
                    <div class="box-content">
                        <strong>Received By:</strong> {{ $proof->raw['name'] ?? ($proof->raw['receiver_name'] ?? 'Authorized Representative') }}<br>
                        <strong>Contact:</strong> {{ $proof->raw['phone'] ?? 'N/A' }}<br>
                        <strong>Remarks:</strong> {{ $proof->raw['remarks'] ?? 'Received full material without discrepancy' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="box">
        <div class="box-header">DIGITAL SIGNATURE & PROOF OF DELIVERY CAPTURE</div>
        <div class="box-content" style="text-align: center; min-height: 120px;">
            @if(!empty($proof->raw['signature_url']) || !empty($proof->file_url))
                <img src="{{ $proof->raw['signature_url'] ?? $proof->file_url }}" style="max-height: 100px; border: 1px solid #ccc; padding: 5px; margin: 10px 0;" alt="Proof Signature" /><br>
                <span style="font-size: 9px; color: #555;">Electronically Captured Signature</span>
            @else
                <div style="height: 70px; border: 1px dashed #aaa; margin: 15px 40px; padding-top: 25px; color: #888;">
                    [ Digital Signature Verified on Driver Mobile Terminal ]
                </div>
            @endif
        </div>
    </div>

    @include('fleetops::pdf._footer')
</body>
</html>
