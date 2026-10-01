<?php

namespace App\Contracts;

interface WhatsAppProviderInterface
{
    /**
     * Send template-based message.
     */
    public function sendMessage(string $toPhone, string $templateName, array $variables = []): array;

    /**
     * Send PDF document via WhatsApp.
     */
    public function sendPdf(string $toPhone, string $pdfUrl, string $caption = '', string $fileName = 'document.pdf'): array;

    /**
     * Send custom raw text message.
     */
    public function sendCustomMessage(string $toPhone, string $message): array;
}
