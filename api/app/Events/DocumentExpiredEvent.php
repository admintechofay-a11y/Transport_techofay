<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentExpiredEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $documentType;
    public string $entityType; // 'vehicle' or 'driver'
    public string $entityUuid;
    public string $documentUuid;
    public string $companyUuid;
    public ?string $expiryDate;

    public function __construct(
        string $entityType,
        string $entityUuid,
        string $documentType,
        string $documentUuid,
        string $companyUuid,
        ?string $expiryDate = null
    ) {
        $this->entityType = $entityType;
        $this->entityUuid = $entityUuid;
        $this->documentType = $documentType;
        $this->documentUuid = $documentUuid;
        $this->companyUuid = $companyUuid;
        $this->expiryDate = $expiryDate;
    }
}
