<?php

namespace App\Services;

use App\Models\LoadLocation;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MultiStopService
{
    public const STATUS_PENDING    = 'pending';
    public const STATUS_ARRIVED    = 'arrived';
    public const STATUS_LOADING    = 'loading';
    public const STATUS_LOADED     = 'loaded';
    public const STATUS_IN_TRANSIT = 'in_transit';
    public const STATUS_DELIVERED  = 'delivered';
    public const STATUS_SKIPPED    = 'skipped';

    /**
     * Allowed status transitions for a multi-stop waypoint.
     */
    protected const ALLOWED_TRANSITIONS = [
        self::STATUS_PENDING => [
            self::STATUS_ARRIVED,
            self::STATUS_LOADING,
            self::STATUS_IN_TRANSIT,
            self::STATUS_SKIPPED,
        ],
        self::STATUS_ARRIVED => [
            self::STATUS_LOADING,
            self::STATUS_LOADED,
            self::STATUS_DELIVERED,
            self::STATUS_SKIPPED,
        ],
        self::STATUS_LOADING => [
            self::STATUS_LOADED,
            self::STATUS_SKIPPED,
        ],
        self::STATUS_LOADED => [
            self::STATUS_IN_TRANSIT,
            self::STATUS_DELIVERED,
            self::STATUS_SKIPPED,
        ],
        self::STATUS_IN_TRANSIT => [
            self::STATUS_ARRIVED,
            self::STATUS_DELIVERED,
            self::STATUS_SKIPPED,
        ],
        self::STATUS_DELIVERED => [], // Terminal
        self::STATUS_SKIPPED   => [], // Terminal
    ];

    /**
     * Add multiple ordered stops to an order.
     */
    public function createStopsForOrder(string $orderUuid, array $stops, string $companyUuid): array
    {
        $created = [];
        $seq = 1;

        foreach ($stops as $stopData) {
            $location = new LoadLocation();
            $location->uuid = (string) Str::uuid();
            $location->company_uuid = $companyUuid;
            $location->load_uuid = $orderUuid;
            $location->sequence = $stopData['sequence'] ?? $seq++;
            $location->location_type = $stopData['location_type'] ?? 'pickup';
            $location->contact_name = $stopData['contact_name'] ?? null;
            $location->contact_phone = $stopData['contact_phone'] ?? null;
            $location->material_items = $stopData['material_items'] ?? null;
            $location->total_quantity = isset($stopData['total_quantity']) ? (float) $stopData['total_quantity'] : null;
            $location->total_weight = isset($stopData['total_weight']) ? (float) $stopData['total_weight'] : null;
            $location->status = self::STATUS_PENDING;
            $location->remarks = $stopData['remarks'] ?? null;
            $location->save();

            $created[] = $location;
        }

        return $created;
    }

    /**
     * Transition a stop's lifecycle status with validation and timestamp recording.
     */
    public function transitionStopStatus(LoadLocation $stop, string $newStatus, array $params = []): LoadLocation
    {
        $newStatus = strtolower($newStatus);
        $currentStatus = strtolower($stop->status);

        if ($currentStatus === $newStatus) {
            return $stop;
        }

        $allowed = self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];
        if (!in_array($newStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => "Cannot transition stop from '{$currentStatus}' to '{$newStatus}'.",
            ]);
        }

        $stop->status = $newStatus;

        if (in_array($newStatus, [self::STATUS_DELIVERED, self::STATUS_SKIPPED], true)) {
            $stop->completed_at = Carbon::now();
            $stop->completed_by_uuid = $params['user_uuid'] ?? null;
        }

        if (isset($params['remarks'])) {
            $stop->remarks = $params['remarks'];
        }

        $stop->save();

        return $stop;
    }
}
