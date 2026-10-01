<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\TransportSetting;
use App\Services\WhatsAppService;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WhatsAppSettingsController extends FleetOpsController
{
    public function __construct()
    {
    }

    /**
     * Mask sensitive strings (API keys, secrets).
     */
    protected function mask(string $value, int $keep = 4): string
    {
        $len = strlen($value);
        if ($len <= $keep) {
            return str_repeat('*', $len);
        }
        return str_repeat('*', max(0, $len - $keep)) . substr($value, -$keep);
    }

    /**
     * Get WhatsApp configuration for current company.
     */
    public function getSettings(Request $request): JsonResponse
    {
        $companyUuid = session('company')
            ?: $request->header('Company-Header')
            ?: $request->header('company')
            ?: $request->user()?->company_uuid;

        $setting = TransportSetting::where('company_uuid', $companyUuid)->first();
        $ws = $setting?->whatsapp_settings ?? [];

        $provider   = data_get($ws, 'provider') ?: config('whatsapp.provider', 'interakt');
        $apiKey     = data_get($ws, 'api_key') ?: config('whatsapp.api_key', '');
        $apiSecret  = data_get($ws, 'api_secret') ?: config('whatsapp.api_secret', '');
        $fromNumber = data_get($ws, 'from_number') ?: config('whatsapp.from_number', '');
        $baseUrl    = data_get($ws, 'base_url') ?: config('whatsapp.base_url', '');
        $enabled    = data_get($ws, 'is_whatsapp_enabled', true);
        $templates  = data_get($ws, 'templates', [
            'lr_template'               => 'LR #{lr_number} dispatched for shipment to {destination}. Track: {tracking_url}',
            'bilty_template'            => 'Bilty #{bilty_number} generated. Freight Amount: ₹{freight_amount}. Balance Payable: ₹{balance_payable}',
            'challan_template'          => 'Delivery Challan #{challan_number} issued for vehicle {vehicle_number}.',
            'pod_template'              => 'Proof of Delivery for Load #{load_number} recorded. Consignee: {consignee_name}.',
            'payment_reminder_template' => 'Payment Reminder: Balance ₹{balance_payable} outstanding for Load #{load_number}.',
        ]);

        return response()->json([
            'provider'           => $provider,
            'api_key_masked'     => $apiKey ? $this->mask($apiKey) : null,
            'api_secret_masked'  => $apiSecret ? $this->mask($apiSecret) : null,
            'is_api_key_set'     => !empty($apiKey),
            'is_api_secret_set'  => !empty($apiSecret),
            'from_number'        => $fromNumber,
            'sender_number'      => $fromNumber,
            'base_url'           => $baseUrl,
            'is_enabled'         => (bool) $enabled,
            'templates'          => $templates,
        ]);
    }

    /**
     * Update WhatsApp settings for current company.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $companyUuid = session('company')
            ?: $request->header('Company-Header')
            ?: $request->header('company')
            ?: $request->user()?->company_uuid;

        if (!$companyUuid) {
            return response()->json(['error' => 'Company context required.'], 400);
        }

        $setting = TransportSetting::firstOrNew(['company_uuid' => $companyUuid]);
        if (!$setting->uuid) {
            $setting->uuid = (string) Str::uuid();
        }

        $ws = $setting->whatsapp_settings ?? [];

        if ($request->has('provider')) {
            $ws['provider'] = $request->input('provider');
        }

        $apiKey = $request->input('api_key') ?? $request->input('apiKey');
        if (!empty($apiKey) && !str_contains($apiKey, '***')) {
            $ws['api_key'] = $apiKey;
        }

        $apiSecret = $request->input('api_secret') ?? $request->input('apiSecret');
        if (!empty($apiSecret) && !str_contains($apiSecret, '***')) {
            $ws['api_secret'] = $apiSecret;
        }

        $fromNumber = $request->input('from_number') ?? $request->input('senderNumber') ?? $request->input('fromNumber');
        if ($fromNumber !== null) {
            $ws['from_number'] = $fromNumber;
        }

        if ($request->has('base_url')) {
            $ws['base_url'] = $request->input('base_url');
        }

        if ($request->has('is_whatsapp_enabled')) {
            $ws['is_whatsapp_enabled'] = (bool) $request->input('is_whatsapp_enabled');
        }

        // Templates can come directly or in templates object
        $templates = $request->input('templates', []);
        foreach (['lrTemplate', 'biltyTemplate', 'challanTemplate', 'podTemplate', 'paymentReminderTemplate'] as $tmplKey) {
            if ($request->has($tmplKey)) {
                $snakeKey = Str::snake($tmplKey);
                $templates[$snakeKey] = $request->input($tmplKey);
            }
        }
        if (!empty($templates)) {
            $ws['templates'] = array_merge($ws['templates'] ?? [], $templates);
        }

        $setting->whatsapp_settings = $ws;
        $setting->save();

        return response()->json([
            'message'  => 'WhatsApp settings saved successfully.',
            'settings' => [
                'provider'            => $ws['provider'] ?? 'interakt',
                'from_number'         => $ws['from_number'] ?? '',
                'is_whatsapp_enabled' => $ws['is_whatsapp_enabled'] ?? true,
                'is_api_key_set'      => !empty($ws['api_key']),
                'templates'           => $ws['templates'] ?? [],
            ],
        ]);
    }

    /**
     * Send test WhatsApp message.
     */
    public function testConnection(Request $request, WhatsAppService $service): JsonResponse
    {
        $companyUuid = session('company')
            ?: $request->header('Company-Header')
            ?: $request->header('company')
            ?: $request->user()?->company_uuid;

        $phone = $request->input('phone') ?? $request->input('senderNumber') ?? $request->input('from_number');
        if (empty($phone)) {
            return response()->json(['error' => 'Phone number is required.'], 422);
        }

        $message = $request->input('message') ?? 'Test ping from Technofay Logistics WhatsApp Gateway.';

        try {
            $result = $service->forCompany($companyUuid ?? '')->sendCustomMessage($phone, $message);

            return response()->json([
                'success' => true,
                'message' => "WhatsApp test ping successfully delivered to {$phone}.",
                'result'  => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error'   => 'Failed to dispatch test message: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get configured templates.
     */
    public function getTemplates(Request $request): JsonResponse
    {
        $companyUuid = session('company')
            ?: $request->header('Company-Header')
            ?: $request->header('company')
            ?: $request->user()?->company_uuid;

        $setting = TransportSetting::where('company_uuid', $companyUuid)->first();
        $ws = $setting?->whatsapp_settings ?? [];

        $templates = data_get($ws, 'templates', [
            'lr_template'               => 'LR #{lr_number} dispatched for shipment to {destination}. Track: {tracking_url}',
            'bilty_template'            => 'Bilty #{bilty_number} generated. Freight Amount: ₹{freight_amount}. Balance Payable: ₹{balance_payable}',
            'challan_template'          => 'Delivery Challan #{challan_number} issued for vehicle {vehicle_number}.',
            'pod_template'              => 'Proof of Delivery for Load #{load_number} recorded. Consignee: {consignee_name}.',
            'payment_reminder_template' => 'Payment Reminder: Balance ₹{balance_payable} outstanding for Load #{load_number}.',
        ]);

        return response()->json(['templates' => $templates]);
    }

    /**
     * Update template mappings.
     */
    public function updateTemplates(Request $request): JsonResponse
    {
        $companyUuid = session('company')
            ?: $request->header('Company-Header')
            ?: $request->header('company')
            ?: $request->user()?->company_uuid;

        if (!$companyUuid) {
            return response()->json(['error' => 'Company context required.'], 400);
        }

        $templates = $request->input('templates', []);

        $setting = TransportSetting::firstOrNew(['company_uuid' => $companyUuid]);
        if (!$setting->uuid) {
            $setting->uuid = (string) Str::uuid();
        }

        $ws = $setting->whatsapp_settings ?? [];
        $ws['templates'] = array_merge($ws['templates'] ?? [], $templates);
        $setting->whatsapp_settings = $ws;
        $setting->save();

        return response()->json([
            'message'   => 'WhatsApp templates updated successfully.',
            'templates' => $ws['templates'],
        ]);
    }
}
