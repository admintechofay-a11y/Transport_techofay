<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentExpiringSoonEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $documentType;
    public string $entityType; // 'vehicle' or 'driver'
    public string $entityUuid;
    public string $documentUuid;
    public string $companyUuid;
    public int $daysRemaining;
    public ?string $expiryDate;

    public function __construct(
        string $entityType,
        string $entityUuid,
        string $documentType,
        string $documentUuid,
        string $companyUuid,
        int $daysRemaining,
        ?string $expiryDate = null
    ) {
        $this->entityType = $entityType;
        $this->entityUuid = $entityUuid;
        $this->documentType = $documentType;
        $this->documentUuid = $documentUuid;
        $this->companyUuid = $companyUuid;
        $this->daysRemaining = $daysRemaining;
        $this->expiryDate = $expiryDate;
    }
}
