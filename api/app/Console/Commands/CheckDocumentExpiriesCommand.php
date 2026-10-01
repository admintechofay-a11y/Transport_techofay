<?php

namespace App\Console\Commands;

use App\Jobs\CheckDocumentExpiriesJob;
use Illuminate\Console\Command;

class CheckDocumentExpiriesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'documents:check-expiries {--days=30 : Days threshold for expiring soon alert}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Evaluate vehicle and driver document expiries across all fleets and trigger expiry alerts';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $this->info("Scanning fleet documents with {$days}-day warning threshold...");

        $results = dispatch_sync(new CheckDocumentExpiriesJob($days));

        $this->table(
            ['Metric', 'Count'],
            [
                ['Expired Documents Dispatched', $results['expired'] ?? 0],
                ['Expiring Soon Alerts Dispatched', $results['expiring_soon'] ?? 0],
            ]
        );

        $this->info('Daily document compliance evaluation completed successfully.');
        return Command::SUCCESS;
    }
}
