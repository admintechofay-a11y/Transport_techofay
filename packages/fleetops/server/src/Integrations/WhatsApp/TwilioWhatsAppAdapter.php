<?php

namespace Fleetbase\FleetOps\Integrations\WhatsApp;

use Fleetbase\FleetOps\Contracts\WhatsAppProviderInterface;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class TwilioWhatsAppAdapter implements WhatsAppProviderInterface
{
    protected array $config;
    protected Client $client;

    public function __construct(array $config = [])
    {
        $this->config = $config;
        $this->client = new Client([
            'base_uri' => 'https://api.twilio.com/2010-04-01/',
            'timeout'  => 15,
        ]);
    }

    public function sendMessage(string $toPhone, string $templateName, array $variables = []): array
    {
        $body = "Notification: {$templateName}";
        if (!empty($variables)) {
            foreach ($variables as $key => $val) {
                $body .= "\n{$key}: {$val}";
            }
        }

        return $this->sendCustomMessage($toPhone, $body);
    }

    public function sendPdf(string $toPhone, string $pdfUrl, string $caption = '', string $fileName = 'document.pdf'): array
    {
        return $this->postTwilio([
            'To'       => $this->formatNumber($toPhone),
            'From'     => $this->formatNumber($this->config['from_number'] ?? ''),
            'Body'     => $caption ?: $fileName,
            'MediaUrl' => $pdfUrl,
        ]);
    }

    public function sendCustomMessage(string $toPhone, string $message): array
    {
        return $this->postTwilio([
            'To'   => $this->formatNumber($toPhone),
            'From' => $this->formatNumber($this->config['from_number'] ?? ''),
            'Body' => $message,
        ]);
    }

    protected function postTwilio(array $formParams): array
    {
        $sid = $this->config['api_key'] ?? '';
        $token = $this->config['api_secret'] ?? '';

        if (empty($sid) || empty($token)) {
            Log::warning('WhatsApp Twilio credentials missing');
            return ['status' => 'skipped', 'message' => 'Twilio credentials not configured'];
        }

        try {
            $response = $this->client->post("Accounts/{$sid}/Messages.json", [
                'auth'        => [$sid, $token],
                'form_params' => $formParams,
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? ['status' => 'sent'];
        } catch (\Throwable $e) {
            Log::error('Twilio WhatsApp error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    protected function formatNumber(string $number): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $number);
        if (str_starts_with($number, 'whatsapp:')) {
            return $number;
        }
        return 'whatsapp:+' . ltrim($cleaned, '+');
    }
}
