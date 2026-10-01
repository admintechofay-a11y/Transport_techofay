<?php

namespace Fleetbase\FleetOps\Integrations\WhatsApp;

use Fleetbase\FleetOps\Contracts\WhatsAppProviderInterface;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class GupshupWhatsAppAdapter implements WhatsAppProviderInterface
{
    protected array $config;
    protected Client $client;

    public function __construct(array $config = [])
    {
        $this->config = $config;
        $this->client = new Client([
            'base_uri' => $config['base_url'] ?? 'https://api.gupshup.io/wa/api/v1/',
            'timeout'  => 15,
        ]);
    }

    public function sendMessage(string $toPhone, string $templateName, array $variables = []): array
    {
        $apiKey = $this->config['api_key'] ?? '';
        if (empty($apiKey)) {
            return ['status' => 'skipped', 'message' => 'Gupshup API key not configured'];
        }

        try {
            $response = $this->client->post('template/msg', [
                'headers' => [
                    'apikey'       => $apiKey,
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'form_params' => [
                    'source'      => $this->config['from_number'] ?? '',
                    'destination' => $this->cleanNumber($toPhone),
                    'template'    => json_encode([
                        'id'     => $templateName,
                        'params' => array_values($variables),
                    ]),
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? ['status' => 'sent'];
        } catch (\Throwable $e) {
            Log::error('Gupshup WhatsApp template error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    public function sendPdf(string $toPhone, string $pdfUrl, string $caption = '', string $fileName = 'document.pdf'): array
    {
        $apiKey = $this->config['api_key'] ?? '';
        if (empty($apiKey)) {
            return ['status' => 'skipped', 'message' => 'Gupshup API key not configured'];
        }

        try {
            $response = $this->client->post('msg', [
                'headers' => [
                    'apikey'       => $apiKey,
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'form_params' => [
                    'channel'     => 'whatsapp',
                    'source'      => $this->config['from_number'] ?? '',
                    'destination' => $this->cleanNumber($toPhone),
                    'message'     => json_encode([
                        'type'     => 'file',
                        'url'      => $pdfUrl,
                        'filename' => $fileName,
                        'caption'  => $caption,
                    ]),
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? ['status' => 'sent'];
        } catch (\Throwable $e) {
            Log::error('Gupshup WhatsApp sendPdf error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    public function sendCustomMessage(string $toPhone, string $message): array
    {
        $apiKey = $this->config['api_key'] ?? '';
        if (empty($apiKey)) {
            return ['status' => 'skipped', 'message' => 'Gupshup API key not configured'];
        }

        try {
            $response = $this->client->post('msg', [
                'headers' => [
                    'apikey'       => $apiKey,
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'form_params' => [
                    'channel'     => 'whatsapp',
                    'source'      => $this->config['from_number'] ?? '',
                    'destination' => $this->cleanNumber($toPhone),
                    'message'     => json_encode([
                        'type' => 'text',
                        'text' => $message,
                    ]),
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? ['status' => 'sent'];
        } catch (\Throwable $e) {
            Log::error('Gupshup WhatsApp message error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    protected function cleanNumber(string $number): string
    {
        return preg_replace('/[^0-9]/', '', $number);
    }
}
