<?php

namespace Fleetbase\FleetOps\Services;

use Fleetbase\FleetOps\Contracts\WhatsAppProviderInterface;
use Fleetbase\FleetOps\Integrations\WhatsApp\GupshupWhatsAppAdapter;
use Fleetbase\FleetOps\Integrations\WhatsApp\InteraktAdapter;
use Fleetbase\FleetOps\Integrations\WhatsApp\ThreeSixtyDialogAdapter;
use Fleetbase\FleetOps\Integrations\WhatsApp\TwilioWhatsAppAdapter;
use Fleetbase\FleetOps\Models\Bilty;
use Fleetbase\FleetOps\Models\DeliveryChallan;
use Fleetbase\FleetOps\Models\LrNumber;
use Fleetbase\FleetOps\Models\TransportSetting;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected ?WhatsAppProviderInterface $provider = null;
    protected array $config = [];

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? config('whatsapp', []);
        $this->provider = $this->resolveProvider();
    }

    public function isEnabled(): bool
    {
        return (bool) ($this->config['enabled'] ?? false) || !empty($this->config['api_key']);
    }

    public function resolveProvider(?string $providerName = null, ?array $overrideConfig = null): ?WhatsAppProviderInterface
    {
        $cfg = array_merge($this->config, $overrideConfig ?? []);
        $name = $providerName ?: ($cfg['provider'] ?? 'twilio');

        return match (strtolower($name)) {
            'gupshup'             => new GupshupWhatsAppAdapter($cfg),
            '360dialog', 'dialog' => new ThreeSixtyDialogAdapter($cfg),
            'interakt'            => new InteraktAdapter($cfg),
            default               => new TwilioWhatsAppAdapter($cfg),
        };
    }

    public function forCompany(string $companyUuid): static
    {
        $setting = TransportSetting::where('company_uuid', $companyUuid)->first();
        if ($setting && !empty($setting->whatsapp_settings)) {
            $merged = array_merge($this->config, (array) $setting->whatsapp_settings);
            return new static($merged);
        }

        return $this;
    }

    public function sendMessage(string $toPhone, string $templateName, array $variables = []): array
    {
        if (!$this->isEnabled() || !$this->provider) {
            return ['status' => 'skipped', 'message' => 'WhatsApp integration is disabled or unconfigured'];
        }

        return $this->provider->sendMessage($toPhone, $templateName, $variables);
    }

    public function sendPdf(string $toPhone, string $pdfUrl, string $caption = '', string $fileName = 'document.pdf'): array
    {
        if (!$this->isEnabled() || !$this->provider) {
            return ['status' => 'skipped', 'message' => 'WhatsApp integration is disabled or unconfigured'];
        }

        return $this->provider->sendPdf($toPhone, $pdfUrl, $caption, $fileName);
    }

    public function sendCustomMessage(string $toPhone, string $message): array
    {
        if (!$this->isEnabled() || !$this->provider) {
            return ['status' => 'skipped', 'message' => 'WhatsApp integration is disabled or unconfigured'];
        }

        return $this->provider->sendCustomMessage($toPhone, $message);
    }

    public function sendLrPdf(LrNumber $lr): array
    {
        $phone = $lr->customer?->phone ?? $lr->consignor?->phone ?? $lr->driver?->phone;
        if (empty($phone)) {
            return ['status' => 'error', 'message' => 'No recipient phone number found for LR'];
        }

        $service = $this->forCompany($lr->company_uuid);
        $pdfUrl = url("/int/v1/lr-numbers/{$lr->public_id}/pdf");
        $caption = "Lorry Receipt {$lr->lr_number} for shipment from {$lr->from_location} to {$lr->to_location}.";
        $fileName = "LR-{$lr->lr_number}.pdf";

        return $service->sendPdf($phone, $pdfUrl, $caption, $fileName);
    }

    public function sendBiltyPdf(Bilty $bilty): array
    {
        $phone = $bilty->customer?->phone ?? $bilty->consignee?->phone ?? $bilty->consignor?->phone;
        if (empty($phone)) {
            return ['status' => 'error', 'message' => 'No recipient phone number found for Bilty'];
        }

        $service = $this->forCompany($bilty->company_uuid);
        $pdfUrl = url("/int/v1/bilties/{$bilty->public_id}/pdf");
        $caption = "Consignment Note / Bilty {$bilty->bilty_number} - Total Freight: INR {$bilty->freight_amount}, Balance: INR {$bilty->balance_amount}.";
        $fileName = "Bilty-{$bilty->bilty_number}.pdf";

        return $service->sendPdf($phone, $pdfUrl, $caption, $fileName);
    }

    public function sendDeliveryChallanPdf(DeliveryChallan $challan): array
    {
        $phone = $challan->consignee?->phone;
        if (empty($phone)) {
            return ['status' => 'error', 'message' => 'No recipient phone number found for Delivery Challan'];
        }

        $service = $this->forCompany($challan->company_uuid);
        $pdfUrl = url("/int/v1/delivery-challans/{$challan->public_id}/pdf");
        $caption = "Delivery Challan {$challan->challan_number} for delivery verification.";
        $fileName = "Challan-{$challan->challan_number}.pdf";

        return $service->sendPdf($phone, $pdfUrl, $caption, $fileName);
    }

    public function sendStatusUpdate(string $toPhone, string $status, array $loadDetails = []): array
    {
        $template = config("whatsapp.templates.{$status}", config('whatsapp.templates.custom_message', 'status_update'));
        $variables = array_merge(['status' => strtoupper(str_replace('_', ' ', $status))], $loadDetails);

        return $this->sendMessage($toPhone, $template, $variables);
    }
}
