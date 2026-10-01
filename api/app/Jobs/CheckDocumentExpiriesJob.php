<?php

namespace App\Jobs;

use App\Services\DocumentComplianceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckDocumentExpiriesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $warningDays;

    /**
     * Create a new job instance.
     */
    public function __construct(int $warningDays = 30)
    {
        $this->warningDays = $warningDays;
    }

    /**
     * Execute the job.
     */
    public function handle(DocumentComplianceService $service): array
    {
        $results = $service->processDailyExpiries($this->warningDays);

        Log::info(sprintf(
            '[DocumentCompliance] Processed daily expiries: %d expired, %d expiring soon (threshold: %d days)',
            $results['expired'],
            $results['expiring_soon'],
            $this->warningDays
        ));

        return $results;
    }
}
