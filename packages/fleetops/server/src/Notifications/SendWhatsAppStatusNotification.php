<?php

namespace Fleetbase\FleetOps\Notifications;

use Fleetbase\FleetOps\Models\LrNumber;
use Fleetbase\FleetOps\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWhatsAppStatusNotification implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public LrNumber $lrNumber;

    public function __construct(LrNumber $lrNumber)
    {
        $this->lrNumber = $lrNumber;
    }

    public function handle(WhatsAppService $whatsApp): void
    {
        $lr = $this->lrNumber;
        $phone = $lr->customer?->phone ?? $lr->consignor?->phone ?? $lr->driver?->phone;

        if (empty($phone)) {
            Log::info("No phone number to send WhatsApp status notification for LR {$lr->lr_number}");
            return;
        }

        $whatsApp->forCompany($lr->company_uuid)->sendStatusUpdate($phone, $lr->status, [
            'lr_number'     => $lr->lr_number,
            'status'        => $lr->status,
            'from_location' => $lr->from_location ?? 'Origin',
            'to_location'   => $lr->to_location ?? 'Destination',
        ]);
    }
}
