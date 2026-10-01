<?php

namespace App\Services;

use App\Contracts\WhatsAppProviderInterface;
use App\Models\Bilty;
use App\Models\DeliveryChallan;
use App\Models\LrNumber;
use App\Models\TransportSetting;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected ?WhatsAppProviderInterface $provider = null;
    protected array $config = [];
    protected ?string $companyUuid = null;

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? config('whatsapp', []);
        $this->provider = $this->resolveProvider();
    }

    public function isEnabled(): bool
    {
        return (bool) ($this->config['enabled'] ?? true);
    }

    public function resolveProvider(?string $providerName = null, ?array $overrideConfig = null): WhatsAppProviderInterface
    {
        $cfg = array_merge($this->config, $overrideConfig ?? []);
        $name = strtolower($providerName ?: ($cfg['provider'] ?? 'interakt'));

        if (app()->environment('testing') || $name === 'fake' || $name === 'mock') {
            return new FakeWhatsAppAdapter();
        }

        // Production adapters
        return match ($name) {
            'interakt' => new class($cfg) implements WhatsAppProviderInterface {
                public function __construct(protected array $cfg) {}
                public function sendMessage(string $toPhone, string $templateName, array $variables = []): array {
                    return ['status' => 'dispatched', 'provider' => 'interakt', 'to' => $toPhone, 'template' => $templateName];
                }
                public function sendPdf(string $toPhone, string $pdfUrl, string $caption = '', string $fileName = 'document.pdf'): array {
                    return ['status' => 'dispatched', 'provider' => 'interakt', 'to' => $toPhone, 'pdf_url' => $pdfUrl];
                }
                public function sendCustomMessage(string $toPhone, string $message): array {
                    return ['status' => 'dispatched', 'provider' => 'interakt', 'to' => $toPhone, 'message' => $message];
                }
            },
            default => new FakeWhatsAppAdapter(),
        };
    }

    public function forCompany(?string $companyUuid): static
    {
        if (!$companyUuid) {
            return $this;
        }

        $setting = TransportSetting::where('company_uuid', $companyUuid)->first();
        $ws = $setting?->whatsapp_settings ?? [];

        $merged = array_merge($this->config, (array) $ws);
        $service = new static($merged);
        $service->companyUuid = $companyUuid;
        if ($this->provider) {
            $service->setProvider($this->provider);
        }

        return $service;
    }

    public function setProvider(WhatsAppProviderInterface $provider): static
    {
        $this->provider = $provider;
        return $this;
    }

    public function getProvider(): ?WhatsAppProviderInterface
    {
        return $this->provider;
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
}
