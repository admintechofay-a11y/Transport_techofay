<?php

namespace Fleetbase\FleetOps\Observers;

use Fleetbase\FleetOps\Models\LrNumber;
use Fleetbase\FleetOps\Models\LrStatusHistory;
use Fleetbase\FleetOps\Notifications\SendWhatsAppStatusNotification;

class LrNumberObserver
{
    public function updated(LrNumber $lr): void
    {
        if ($lr->isDirty('status')) {
            // Save to status history
            LrStatusHistory::create([
                'company_uuid'    => $lr->company_uuid,
                'lr_uuid'         => $lr->uuid,
                'from_status'     => $lr->getOriginal('status'),
                'to_status'       => $lr->status,
                'remarks'         => request('remarks') ?? ('Status updated to ' . $lr->status),
                'changed_by_uuid' => auth()->id() ?? $lr->updated_by_uuid,
            ]);

            // Dispatch WhatsApp notification
            SendWhatsAppStatusNotification::dispatch($lr);
        }
    }
}
