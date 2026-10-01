<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\TransportSetting;
use Fleetbase\FleetOps\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsAppSettingsController extends FleetOpsController
{
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
        $companyUuid = session('company', $request->user()?->company_uuid);
        $setting = TransportSetting::where('company_uuid', $companyUuid)->first();

        $provider   = $setting?->whatsapp_provider ?: config('whatsapp.provider', 'twilio');
        $apiKey     = $setting?->whatsapp_api_key ?: config('whatsapp.api_key', '');
        $apiSecret  = $setting?->whatsapp_api_secret ?: config('whatsapp.api_secret', '');
        $fromNumber = $setting?->whatsapp_from_number ?: config('whatsapp.from_number', '');
        $baseUrl    = $setting?->whatsapp_base_url ?: config('whatsapp.base_url', '');
        $enabled    = $setting ? (bool) $setting->is_whatsapp_enabled : (bool) config('whatsapp.enabled', true);
        $templates  = $setting?->whatsapp_templates ?: config('whatsapp.templates', []);

        return response()->json([
            'provider'           => $provider,
            'api_key_masked'     => $apiKey ? $this->mask($apiKey) : null,
            'api_secret_masked'  => $apiSecret ? $this->mask($apiSecret) : null,
            'is_api_key_set'     => !empty($apiKey),
            'is_api_secret_set'  => !empty($apiSecret),
            'from_number'        => $fromNumber,
            'base_url'           => $baseUrl,
            'is_enabled'         => $enabled,
            'templates'          => $templates,
        ]);
    }

    /**
     * Update WhatsApp settings for current company.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);

        $validated = $request->validate([
            'provider'            => 'nullable|string|in:twilio,gupshup,360dialog,interakt',
            'api_key'             => 'nullable|string',
            'api_secret'          => 'nullable|string',
            'from_number'         => 'nullable|string|max:50',
            'base_url'            => 'nullable|string|url|max:500',
            'is_whatsapp_enabled' => 'nullable|boolean',
            'templates'           => 'nullable|array',
        ]);

        $setting = TransportSetting::firstOrNew(['company_uuid' => $companyUuid]);

        if (isset($validated['provider'])) {
            $setting->whatsapp_provider = $validated['provider'];
        }

        // Only update key/secret if not empty and not masked
        if (!empty($validated['api_key']) && !str_contains($validated['api_key'], '***')) {
            $setting->whatsapp_api_key = $validated['api_key'];
        }

        if (!empty($validated['api_secret']) && !str_contains($validated['api_secret'], '***')) {
            $setting->whatsapp_api_secret = $validated['api_secret'];
        }

        if (isset($validated['from_number'])) {
            $setting->whatsapp_from_number = $validated['from_number'];
        }

        if (isset($validated['base_url'])) {
            $setting->whatsapp_base_url = $validated['base_url'];
        }

        if (isset($validated['is_whatsapp_enabled'])) {
            $setting->is_whatsapp_enabled = (bool) $validated['is_whatsapp_enabled'];
        }

        if (isset($validated['templates'])) {
            $setting->whatsapp_templates = array_merge($setting->whatsapp_templates ?? [], $validated['templates']);
        }

        $setting->save();

        return response()->json([
            'message'  => 'WhatsApp settings saved successfully.',
            'settings' => [
                'provider'           => $setting->whatsapp_provider,
                'from_number'        => $setting->whatsapp_from_number,
                'is_whatsapp_enabled' => $setting->is_whatsapp_enabled,
                'is_api_key_set'     => !empty($setting->whatsapp_api_key),
                'templates'          => $setting->whatsapp_templates,
            ],
        ]);
    }

    /**
     * Send test WhatsApp message.
     */
    public function testConnection(Request $request, WhatsAppService $service): JsonResponse
    {
        $validated = $request->validate([
            'phone'   => 'required|string',
            'message' => 'nullable|string|max:500',
        ]);

        $phone = $validated['phone'];
        $message = $validated['message'] ?? 'Test message from Fleetbase Indian Road Transport integration.';

        try {
            $result = $service->sendCustomMessage($phone, $message);

            return response()->json([
                'success' => true,
                'message' => "Test WhatsApp message dispatched to {$phone}.",
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
        $companyUuid = session('company', $request->user()?->company_uuid);
        $setting = TransportSetting::where('company_uuid', $companyUuid)->first();

        $templates = $setting?->whatsapp_templates ?: config('whatsapp.templates', [
            'lr_generated'     => 'lr_generated',
            'vehicle_assigned' => 'vehicle_assigned',
            'dispatched'       => 'dispatched',
            'in_transit'       => 'in_transit',
            'delivered'        => 'delivered',
            'custom_message'   => 'custom_message',
        ]);

        return response()->json(['templates' => $templates]);
    }

    /**
     * Update template mappings.
     */
    public function updateTemplates(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $templates = $request->input('templates', []);

        $setting = TransportSetting::firstOrNew(['company_uuid' => $companyUuid]);
        $setting->whatsapp_templates = array_merge($setting->whatsapp_templates ?? [], $templates);
        $setting->save();

        return response()->json([
            'message'   => 'WhatsApp templates updated successfully.',
            'templates' => $setting->whatsapp_templates,
        ]);
    }
}
