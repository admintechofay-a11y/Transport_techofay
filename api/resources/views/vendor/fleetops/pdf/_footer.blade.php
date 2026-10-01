<div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9px; color: #555;">
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="width: 65%; vertical-align: top;">
                <strong>Terms & Conditions:</strong><br>
                {!! nl2br(e($settings['pdf_terms_conditions'] ?? "1. Goods transported strictly at owner's risk.\n2. Carrier not liable for leakage, pilferage or damage beyond carrier control.\n3. Subject to local jurisdiction.")) !!}
            </td>
            <td style="width: 35%; text-align: center; vertical-align: bottom;">
                @if(!empty($settings['signature_url']))
                    <img src="{{ $settings['signature_url'] }}" style="max-height: 40px;" alt="Signature" /><br>
                @else
                    <div style="height: 35px;"></div>
                @endif
                <div style="border-top: 1px dashed #666; padding-top: 4px; font-weight: bold;">
                    Authorized Signatory
                </div>
            </td>
        </tr>
    </table>
    <div style="text-align: center; margin-top: 10px; font-size: 8px; color: #999;">
        Generated electronically by Technofay Transport OS on {{ date('d-m-Y H:i:s') }}
    </div>
</div>
