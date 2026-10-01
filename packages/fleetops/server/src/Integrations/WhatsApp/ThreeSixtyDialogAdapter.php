<?php

namespace Fleetbase\FleetOps\Integrations\WhatsApp;

use Fleetbase\FleetOps\Contracts\WhatsAppProviderInterface;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class ThreeSixtyDialogAdapter implements WhatsAppProviderInterface
{
    protected array $config;
    protected Client $client;

    public function __construct(array $config = [])
    {
        $this->config = $config;
        $this->client = new Client([
            'base_uri' => $config['base_url'] ?? 'https://waba.360dialog.io/v1/',
            'timeout'  => 15,
        ]);
    }

    public function sendMessage(string $toPhone, string $templateName, array $variables = []): array
    {
        $apiKey = $this->config['api_key'] ?? '';
        if (empty($apiKey)) {
            return ['status' => 'skipped', 'message' => '360Dialog API key not configured'];
        }

        try {
            $components = [];
            if (!empty($variables)) {
                $parameters = [];
                foreach ($variables as $val) {
                    $parameters[] = ['type' => 'text', 'text' => (string) $val];
                }
                $components[] = [
                    'type'       => 'body',
                    'parameters' => $parameters,
                ];
            }

            $response = $this->client->post('messages', [
                'headers' => [
                    'D360-API-KEY' => $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'to'       => $this->cleanNumber($toPhone),
                    'type'     => 'template',
                    'template' => [
                        'namespace'  => $this->config['api_secret'] ?? '',
                        'name'       => $templateName,
                        'language'   => ['code' => 'en', 'policy' => 'deterministic'],
                        'components' => $components,
                    ],
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? ['status' => 'sent'];
        } catch (\Throwable $e) {
            Log::error('360Dialog template error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    public function sendPdf(string $toPhone, string $pdfUrl, string $caption = '', string $fileName = 'document.pdf'): array
    {
        $apiKey = $this->config['api_key'] ?? '';
        if (empty($apiKey)) {
            return ['status' => 'skipped', 'message' => '360Dialog API key not configured'];
        }

        try {
            $response = $this->client->post('messages', [
                'headers' => [
                    'D360-API-KEY' => $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'to'       => $this->cleanNumber($toPhone),
                    'type'     => 'document',
                    'document' => [
                        'link'     => $pdfUrl,
                        'caption'  => $caption,
                        'filename' => $fileName,
                    ],
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? ['status' => 'sent'];
        } catch (\Throwable $e) {
            Log::error('360Dialog sendPdf error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    public function sendCustomMessage(string $toPhone, string $message): array
    {
        $apiKey = $this->config['api_key'] ?? '';
        if (empty($apiKey)) {
            return ['status' => 'skipped', 'message' => '360Dialog API key not configured'];
        }

        try {
            $response = $this->client->post('messages', [
                'headers' => [
                    'D360-API-KEY' => $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'to'   => $this->cleanNumber($toPhone),
                    'type' => 'text',
                    'text' => [
                        'body' => $message,
                    ],
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? ['status' => 'sent'];
        } catch (\Throwable $e) {
            Log::error('360Dialog sendCustomMessage error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    protected function cleanNumber(string $number): string
    {
        return preg_replace('/[^0-9]/', '', $number);
    }
}
