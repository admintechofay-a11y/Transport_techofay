<?php

namespace Fleetbase\FleetOps\Integrations\WhatsApp;

use Fleetbase\FleetOps\Contracts\WhatsAppProviderInterface;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class InteraktAdapter implements WhatsAppProviderInterface
{
    protected array $config;
    protected Client $client;

    public function __construct(array $config = [])
    {
        $this->config = $config;
        $this->client = new Client([
            'base_uri' => $config['base_url'] ?? 'https://api.interakt.ai/v1/',
            'timeout'  => 15,
        ]);
    }

    public function sendMessage(string $toPhone, string $templateName, array $variables = []): array
    {
        $apiKey = $this->config['api_key'] ?? '';
        if (empty($apiKey)) {
            return ['status' => 'skipped', 'message' => 'Interakt API key not configured'];
        }

        try {
            $response = $this->client->post('public/message/', [
                'headers' => [
                    'Authorization' => 'Basic ' . base64_encode($apiKey . ':'),
                    'Content-Type'  => 'application/json',
                ],
                'json' => [
                    'countryCode'  => '+91',
                    'phoneNumber'  => $this->getNationalNumber($toPhone),
                    'type'         => 'Template',
                    'template'     => [
                        'name'            => $templateName,
                        'languageCode'    => 'en',
                        'bodyValues'      => array_values($variables),
                    ],
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? ['status' => 'sent'];
        } catch (\Throwable $e) {
            Log::error('Interakt template error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    public function sendPdf(string $toPhone, string $pdfUrl, string $caption = '', string $fileName = 'document.pdf'): array
    {
        $apiKey = $this->config['api_key'] ?? '';
        if (empty($apiKey)) {
            return ['status' => 'skipped', 'message' => 'Interakt API key not configured'];
        }

        try {
            $response = $this->client->post('public/message/', [
                'headers' => [
                    'Authorization' => 'Basic ' . base64_encode($apiKey . ':'),
                    'Content-Type'  => 'application/json',
                ],
                'json' => [
                    'countryCode'  => '+91',
                    'phoneNumber'  => $this->getNationalNumber($toPhone),
                    'type'         => 'Document',
                    'document'     => [
                        'url'      => $pdfUrl,
                        'fileName' => $fileName,
                        'caption'  => $caption,
                    ],
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? ['status' => 'sent'];
        } catch (\Throwable $e) {
            Log::error('Interakt sendPdf error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    public function sendCustomMessage(string $toPhone, string $message): array
    {
        $apiKey = $this->config['api_key'] ?? '';
        if (empty($apiKey)) {
            return ['status' => 'skipped', 'message' => 'Interakt API key not configured'];
        }

        try {
            $response = $this->client->post('public/message/', [
                'headers' => [
                    'Authorization' => 'Basic ' . base64_encode($apiKey . ':'),
                    'Content-Type'  => 'application/json',
                ],
                'json' => [
                    'countryCode' => '+91',
                    'phoneNumber' => $this->getNationalNumber($toPhone),
                    'type'        => 'Text',
                    'text'        => [
                        'body' => $message,
                    ],
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? ['status' => 'sent'];
        } catch (\Throwable $e) {
            Log::error('Interakt sendCustomMessage error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    protected function getNationalNumber(string $number): string
    {
        $digits = preg_replace('/[^0-9]/', '', $number);
        if (strlen($digits) > 10 && str_starts_with($digits, '91')) {
            return substr($digits, 2);
        }
        return $digits;
    }
}
