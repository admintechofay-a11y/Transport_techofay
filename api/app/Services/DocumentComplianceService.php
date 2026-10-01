<?php

namespace App\Services;

use App\Events\DocumentExpiredEvent;
use App\Events\DocumentExpiringSoonEvent;
use App\Models\DriverDocument;
use App\Models\VehicleDocument;
use Carbon\Carbon;
use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\Vehicle;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentComplianceService
{
    public const STATUS_VALID = 'VALID';
    public const STATUS_EXPIRING_SOON = 'EXPIRING_SOON';
    public const STATUS_EXPIRED = 'EXPIRED';
    public const STATUS_MISSING = 'MISSING';

    public const VEHICLE_MANDATORY_DOCS = [
        'rc',
        'insurance',
        'fitness_certificate',
    ];

    public const DRIVER_MANDATORY_DOCS = [
        'driving_licence',
    ];

    /**
     * Store or replace a vehicle document.
     */
    public function storeVehicleDocument(
        Vehicle $vehicle,
        string $documentType,
        ?string $expiryDate = null,
        ?UploadedFile $file = null,
        array $attributes = []
    ): VehicleDocument {
        $companyUuid = $vehicle->company_uuid;

        // If an active document of this type already exists, replace it by deactivating previous
        VehicleDocument::where('vehicle_uuid', $vehicle->uuid)
            ->where('document_type', $documentType)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $filePath = null;
        if ($file) {
            $filePath = $file->store('documents/vehicles/' . $vehicle->uuid, 'local');
        }

        $doc = VehicleDocument::create(array_merge([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => $documentType,
            'expiry_date'   => $expiryDate ? Carbon::parse($expiryDate)->toDateString() : null,
            'file_url'      => $filePath,
            'is_active'     => true,
        ], $attributes));

        return $doc;
    }

    /**
     * Store or replace a driver document.
     */
    public function storeDriverDocument(
        Driver $driver,
        string $documentType,
        ?string $expiryDate = null,
        ?UploadedFile $file = null,
        array $attributes = []
    ): DriverDocument {
        $companyUuid = $driver->company_uuid;

        // Replace existing active document
        DriverDocument::where('driver_uuid', $driver->uuid)
            ->where('document_type', $documentType)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $filePath = null;
        if ($file) {
            $filePath = $file->store('documents/drivers/' . $driver->uuid, 'local');
        }

        $doc = DriverDocument::create(array_merge([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $companyUuid,
            'driver_uuid'   => $driver->uuid,
            'document_type' => $documentType,
            'expiry_date'   => $expiryDate ? Carbon::parse($expiryDate)->toDateString() : null,
            'file_url'      => $filePath,
            'is_active'     => true,
        ], $attributes));

        return $doc;
    }

    /**
     * Determine compliance status of a document.
     */
    public function evaluateStatus(?string $expiryDate, int $warningDays = 30): string
    {
        if (empty($expiryDate)) {
            return self::STATUS_VALID;
        }

        $today = Carbon::today();
        $expiry = Carbon::parse($expiryDate)->startOfDay();

        if ($expiry->lt($today)) {
            return self::STATUS_EXPIRED;
        }

        if ($expiry->lte($today->copy()->addDays($warningDays))) {
            return self::STATUS_EXPIRING_SOON;
        }

        return self::STATUS_VALID;
    }

    /**
     * Check compliance summary for a vehicle.
     */
    public function getVehicleComplianceSummary(Vehicle $vehicle): array
    {
        $docs = VehicleDocument::where('vehicle_uuid', $vehicle->uuid)
            ->where('is_active', true)
            ->get()
            ->keyBy('document_type');

        $summary = [];
        $overallCompliant = true;

        foreach (self::VEHICLE_MANDATORY_DOCS as $requiredType) {
            if (!isset($docs[$requiredType])) {
                $summary[$requiredType] = [
                    'status' => self::STATUS_MISSING,
                    'document' => null,
                ];
                $overallCompliant = false;
            } else {
                $status = $this->evaluateStatus($docs[$requiredType]->expiry_date);
                $summary[$requiredType] = [
                    'status' => $status,
                    'document' => $docs[$requiredType],
                ];
                if ($status === self::STATUS_EXPIRED) {
                    $overallCompliant = false;
                }
            }
        }

        return [
            'is_compliant' => $overallCompliant,
            'documents'    => $summary,
        ];
    }

    /**
     * Check compliance summary for a driver.
     */
    public function getDriverComplianceSummary(Driver $driver): array
    {
        $docs = DriverDocument::where('driver_uuid', $driver->uuid)
            ->where('is_active', true)
            ->get()
            ->keyBy('document_type');

        $summary = [];
        $overallCompliant = true;

        foreach (self::DRIVER_MANDATORY_DOCS as $requiredType) {
            if (!isset($docs[$requiredType])) {
                $summary[$requiredType] = [
                    'status' => self::STATUS_MISSING,
                    'document' => null,
                ];
                $overallCompliant = false;
            } else {
                $status = $this->evaluateStatus($docs[$requiredType]->expiry_date);
                $summary[$requiredType] = [
                    'status' => $status,
                    'document' => $docs[$requiredType],
                ];
                if ($status === self::STATUS_EXPIRED) {
                    $overallCompliant = false;
                }
            }
        }

        return [
            'is_compliant' => $overallCompliant,
            'documents'    => $summary,
        ];
    }

    /**
     * Daily check of all documents across the fleet.
     * Fires DocumentExpiredEvent or DocumentExpiringSoonEvent as needed.
     */
    public function processDailyExpiries(int $warningDays = 30): array
    {
        $expiredCount = 0;
        $expiringSoonCount = 0;

        $today = Carbon::today();
        $threshold = $today->copy()->addDays($warningDays);

        // 1. Process active vehicle documents
        $vehicleDocs = VehicleDocument::where('is_active', true)
            ->whereNotNull('expiry_date')
            ->get();

        foreach ($vehicleDocs as $doc) {
            $expiry = Carbon::parse($doc->expiry_date)->startOfDay();

            if ($expiry->lt($today)) {
                $expiredCount++;
                event(new DocumentExpiredEvent(
                    'vehicle',
                    $doc->vehicle_uuid,
                    $doc->document_type,
                    $doc->uuid,
                    $doc->company_uuid,
                    $doc->expiry_date
                ));
            } elseif ($expiry->lte($threshold)) {
                $expiringSoonCount++;
                $daysRemaining = (int) $today->diffInDays($expiry, false);
                event(new DocumentExpiringSoonEvent(
                    'vehicle',
                    $doc->vehicle_uuid,
                    $doc->document_type,
                    $doc->uuid,
                    $doc->company_uuid,
                    $daysRemaining,
                    $doc->expiry_date
                ));
            }
        }

        // 2. Process active driver documents
        $driverDocs = DriverDocument::where('is_active', true)
            ->whereNotNull('expiry_date')
            ->get();

        foreach ($driverDocs as $doc) {
            $expiry = Carbon::parse($doc->expiry_date)->startOfDay();

            if ($expiry->lt($today)) {
                $expiredCount++;
                event(new DocumentExpiredEvent(
                    'driver',
                    $doc->driver_uuid,
                    $doc->document_type,
                    $doc->uuid,
                    $doc->company_uuid,
                    $doc->expiry_date
                ));
            } elseif ($expiry->lte($threshold)) {
                $expiringSoonCount++;
                $daysRemaining = (int) $today->diffInDays($expiry, false);
                event(new DocumentExpiringSoonEvent(
                    'driver',
                    $doc->driver_uuid,
                    $doc->document_type,
                    $doc->uuid,
                    $doc->company_uuid,
                    $daysRemaining,
                    $doc->expiry_date
                ));
            }
        }

        return [
            'expired'       => $expiredCount,
            'expiring_soon' => $expiringSoonCount,
        ];
    }
}
