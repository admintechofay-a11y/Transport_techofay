<div style="border-bottom: 2px solid #222; padding-bottom: 8px; margin-bottom: 12px;">
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="width: 60%; vertical-align: top;">
                @if(!empty($settings['company_logo_url']))
                    <img src="{{ $settings['company_logo_url'] }}" style="max-height: 45px; margin-bottom: 5px;" alt="Logo" /><br>
                @endif
                <span style="font-size: 16px; font-weight: bold; color: #111; text-transform: uppercase;">
                    {{ $settings['company_name'] ?? 'TECHNOFAY TRANSPORT & LOGISTICS' }}
                </span>
                <div style="font-size: 10px; color: #444; margin-top: 3px; line-height: 1.3;">
                    {{ $settings['company_address'] ?? 'Transport Nagar, Ring Road' }}<br>
                    @if(!empty($settings['company_phone'])) Phone: {{ $settings['company_phone'] }} @endif
                    @if(!empty($settings['company_email'])) | Email: {{ $settings['company_email'] }} @else | Email: admin.techofay@gmail.com @endif
                </div>
            </td>
            <td style="width: 40%; vertical-align: top; text-align: right;">
                <div style="display: inline-block; padding: 4px 8px; background: #eee; border: 1px solid #ccc; font-size: 11px; font-weight: bold;">
                    GSTIN: {{ $settings['gstin'] ?? 'UNREGISTERED' }}
                </div>
                <div style="font-size: 14px; font-weight: bold; color: #0284c7; margin-top: 6px; text-transform: uppercase;">
                    {{ $title ?? 'TRANSPORT DOCUMENT' }}
                </div>
                <div style="font-size: 10px; color: #666;">
                    Date: {{ $date ?? date('d-m-Y') }}
                </div>
            </td>
        </tr>
    </table>
</div>
