<?php

namespace App\Services;

use App\Contracts\WhatsAppProviderInterface;

class FakeWhatsAppAdapter implements WhatsAppProviderInterface
{
    public array $sentMessages = [];

    public function sendMessage(string $toPhone, string $templateName, array $variables = []): array
    {
        $entry = [
            'type'      => 'template',
            'to'        => $toPhone,
            'template'  => $templateName,
            'variables' => $variables,
            'sent_at'   => now()->toIso8601String(),
        ];
        $this->sentMessages[] = $entry;

        return [
            'status'     => 'success',
            'message_id' => 'msg_fake_' . uniqid(),
            'to'         => $toPhone,
            'details'    => $entry,
        ];
    }

    public function sendPdf(string $toPhone, string $pdfUrl, string $caption = '', string $fileName = 'document.pdf'): array
    {
        $entry = [
            'type'      => 'pdf',
            'to'        => $toPhone,
            'pdf_url'   => $pdfUrl,
            'caption'   => $caption,
            'file_name' => $fileName,
            'sent_at'   => now()->toIso8601String(),
        ];
        $this->sentMessages[] = $entry;

        return [
            'status'     => 'success',
            'message_id' => 'msg_fake_pdf_' . uniqid(),
            'to'         => $toPhone,
            'details'    => $entry,
        ];
    }

    public function sendCustomMessage(string $toPhone, string $message): array
    {
        $entry = [
            'type'    => 'custom',
            'to'      => $toPhone,
            'message' => $message,
            'sent_at' => now()->toIso8601String(),
        ];
        $this->sentMessages[] = $entry;

        return [
            'status'     => 'success',
            'message_id' => 'msg_fake_txt_' . uniqid(),
            'to'         => $toPhone,
            'details'    => $entry,
        ];
    }
}
