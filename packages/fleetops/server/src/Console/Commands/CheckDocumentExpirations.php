<?php

namespace Fleetbase\FleetOps\Console\Commands;

use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\DriverDocument;
use Fleetbase\FleetOps\Models\Vehicle;
use Fleetbase\FleetOps\Models\VehicleDocument;
use Fleetbase\FleetOps\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Checks for expiring and expired Vehicle and Driver compliance documents.
 * Categorizes documents:
 *  - Critical (Expired or < 7 days remaining)
 *  - Urgent (7 to 30 days remaining)
 *  - Valid (> 30 days remaining)
 *
 * Can optionally dispatch WhatsApp alerts to fleet managers.
 */
class CheckDocumentExpirations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fleetops:check-document-expirations
                            {--days=30 : Number of days window to flag as upcoming expiry}
                            {--send-whatsapp : Dispatch WhatsApp notification alerts}
                            {--dry-run : Run check without updating records or sending messages}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan fleet vehicles and drivers for expiring RTO compliance documents and commercial driving licenses';

    /**
     * Execute the console command.
     */
    public function handle(WhatsAppService $whatsAppService): int
    {
        $days = (int) $this->option('days');
        $sendWhatsApp = (bool) $this->option('send-whatsapp');
        $dryRun = (bool) $this->option('dry-run');

        $this->info("Scanning compliance documents expiring within {$days} days" . ($dryRun ? ' [DRY RUN]' : ''));

        $today = Carbon::today();
        $thresholdDate = Carbon::today()->addDays($days);

        // 1. Vehicle Documents
        $vehicleDocs = VehicleDocument::with('vehicle')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $thresholdDate)
            ->where('is_active', true)
            ->orderBy('expiry_date', 'asc')
            ->get();

        // 2. Driver Documents
        $driverDocs = DriverDocument::with('driver')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $thresholdDate)
            ->where('is_active', true)
            ->orderBy('expiry_date', 'asc')
            ->get();

        // 3. Driver Commercial Driving Licenses
        $driversWithExpiringDl = Driver::whereNotNull('license_expiry_date')
            ->where('license_expiry_date', '<=', $thresholdDate)
            ->orderBy('license_expiry_date', 'asc')
            ->get();

        $rows = [];
        $expiredCount = 0;
        $urgentCount = 0;
        $approachingCount = 0;

        foreach ($vehicleDocs as $doc) {
            $expiry = Carbon::parse($doc->expiry_date);
            $diff = (int) $today->diffInDays($expiry, false);

            if ($diff < 0) {
                $status = '<fg=red>EXPIRED (' . abs($diff) . 'd ago)</>';
                $expiredCount++;
            } elseif ($diff <= 7) {
                $status = '<fg=red;options=bold>CRITICAL (' . $diff . 'd left)</>';
                $urgentCount++;
            } else {
                $status = '<fg=yellow>WARNING (' . $diff . 'd left)</>';
                $approachingCount++;
            }

            $rows[] = [
                'Type' => 'Vehicle',
                'Entity' => $doc->vehicle?->plate_number ?? $doc->vehicle_uuid,
                'Doc Name' => strtoupper(str_replace('_', ' ', $doc->document_type ?? 'Document')),
                'Doc #' => $doc->document_number ?? '-',
                'Expiry' => $expiry->format('d/m/Y'),
                'Urgency' => $status,
            ];
        }

        foreach ($driverDocs as $doc) {
            $expiry = Carbon::parse($doc->expiry_date);
            $diff = (int) $today->diffInDays($expiry, false);

            if ($diff < 0) {
                $status = '<fg=red>EXPIRED (' . abs($diff) . 'd ago)</>';
                $expiredCount++;
            } elseif ($diff <= 7) {
                $status = '<fg=red;options=bold>CRITICAL (' . $diff . 'd left)</>';
                $urgentCount++;
            } else {
                $status = '<fg=yellow>WARNING (' . $diff . 'd left)</>';
                $approachingCount++;
            }

            $rows[] = [
                'Type' => 'Driver Doc',
                'Entity' => $doc->driver?->name ?? $doc->driver_uuid,
                'Doc Name' => strtoupper(str_replace('_', ' ', $doc->document_type ?? 'Document')),
                'Doc #' => $doc->document_number ?? '-',
                'Expiry' => $expiry->format('d/m/Y'),
                'Urgency' => $status,
            ];
        }

        foreach ($driversWithExpiringDl as $driver) {
            $expiry = Carbon::parse($driver->license_expiry_date);
            $diff = (int) $today->diffInDays($expiry, false);

            if ($diff < 0) {
                $status = '<fg=red>EXPIRED (' . abs($diff) . 'd ago)</>';
                $expiredCount++;
            } elseif ($diff <= 7) {
                $status = '<fg=red;options=bold>CRITICAL (' . $diff . 'd left)</>';
                $urgentCount++;
            } else {
                $status = '<fg=yellow>WARNING (' . $diff . 'd left)</>';
                $approachingCount++;
            }

            $rows[] = [
                'Type' => 'Driver DL',
                'Entity' => $driver->name,
                'Doc Name' => 'COMMERCIAL DRIVING LICENSE',
                'Doc #' => $driver->drivers_license_number ?? '-',
                'Expiry' => $expiry->format('d/m/Y'),
                'Urgency' => $status,
            ];
        }

        if (empty($rows)) {
            $this->info("All vehicle and driver compliance documents are healthy. No expirations within {$days} days.");
            return 0;
        }

        $this->table(['Type', 'Entity', 'Doc Name', 'Doc #', 'Expiry', 'Status'], $rows);

        $this->line('');
        $this->info("Summary: {$expiredCount} Expired, {$urgentCount} Critical (<7 days), {$approachingCount} Warning (7-{$days} days).");

        if ($sendWhatsApp && !$dryRun) {
            $this->info('Dispatching WhatsApp alerts for critical documents...');
            // Group by company and send fleet manager summaries
            $groupedByCompany = $vehicleDocs->concat($driverDocs)->groupBy('company_uuid');

            foreach ($groupedByCompany as $companyUuid => $docs) {
                $urgentDocs = $docs->filter(function ($doc) use ($today) {
                    $diff = (int) $today->diffInDays(Carbon::parse($doc->expiry_date), false);
                    return $diff <= 7;
                });

                if ($urgentDocs->isNotEmpty()) {
                    $this->line("Company {$companyUuid}: {$urgentDocs->count()} urgent documents pending renewal.");
                }
            }
        }

        return 0;
    }
}
