<?php

namespace App\Services;

use App\Models\LrNumber;
use App\Models\LrSequence;
use App\Models\LrStatusHistory;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LrDomainService
{
    public const STATUS_BOOKED     = 'BOOKED';
    public const STATUS_LOADED     = 'LOADED';
    public const STATUS_IN_TRANSIT = 'IN_TRANSIT';
    public const STATUS_DELIVERED  = 'DELIVERED';
    public const STATUS_POD_CLOSED = 'POD_CLOSED';
    public const STATUS_CANCELLED  = 'CANCELLED';

    /**
     * Strict state machine transitions definition.
     */
    protected const ALLOWED_TRANSITIONS = [
        self::STATUS_BOOKED => [
            self::STATUS_LOADED,
            self::STATUS_CANCELLED,
        ],
        self::STATUS_LOADED => [
            self::STATUS_IN_TRANSIT,
            self::STATUS_CANCELLED,
        ],
        self::STATUS_IN_TRANSIT => [
            self::STATUS_DELIVERED,
        ],
        self::STATUS_DELIVERED => [
            self::STATUS_POD_CLOSED,
        ],
        self::STATUS_POD_CLOSED => [], // Terminal state
        self::STATUS_CANCELLED  => [], // Terminal state
    ];

    /**
     * Concurrency-safe, atomic sequential LR number generation.
     * Uses DB transaction and lockForUpdate on lr_sequences.
     */
    public function generateAtomicLrNumber(string $companyUuid, ?int $year = null): string
    {
        $year = $year ?: (int) Carbon::now()->format('Y');

        return DB::transaction(function () use ($companyUuid, $year) {
            // Check if sequence table exists
            if (DB::getSchemaBuilder()->hasTable('lr_sequences')) {
                // Ensure a row exists first
                $existing = DB::table('lr_sequences')
                    ->where('company_uuid', $companyUuid)
                    ->where('year', $year)
                    ->first();

                if (!$existing) {
                    try {
                        DB::table('lr_sequences')->insert([
                            'company_uuid'     => $companyUuid,
                            'year'             => $year,
                            'current_sequence' => 0,
                            'created_at'       => now(),
                            'updated_at'       => now(),
                        ]);
                    } catch (\Throwable $e) {
                        // Ignore race condition on insert
                    }
                }

                $record = DB::table('lr_sequences')
                    ->where('company_uuid', $companyUuid)
                    ->where('year', $year)
                    ->lockForUpdate()
                    ->first();

                $nextSeq = ($record ? $record->current_sequence : 0) + 1;

                DB::table('lr_sequences')
                    ->where('id', $record->id)
                    ->update([
                        'current_sequence' => $nextSeq,
                        'updated_at'       => now(),
                    ]);
            } else {
                // Fallback atomic sequence using count inside transaction
                $count = DB::table('lr_numbers')
                    ->where('company_uuid', $companyUuid)
                    ->whereYear('created_at', $year)
                    ->lockForUpdate()
                    ->count();

                $nextSeq = $count + 1;
            }

            return sprintf('LR-%d-%06d', $year, $nextSeq);
        });
    }

    /**
     * Create a new LR with validation, atomic numbering, and initial history.
     *
     * @throws ValidationException
     */
    public function createLr(array $data, ?string $userUuid = null): LrNumber
    {
        $companyUuid = $data['company_uuid'] ?? session('company') ?? request()->header('Company-Header');
        if (!$companyUuid) {
            throw ValidationException::withMessages([
                'company_uuid' => ['Company UUID is required to create an LR.'],
            ]);
        }

        return DB::transaction(function () use ($data, $companyUuid, $userUuid) {
            $lrNumber = $data['lr_number'] ?? null;
            $generationMode = $data['generation_mode'] ?? 'auto';

            if (empty($lrNumber) || $generationMode === 'auto') {
                $lrNumber = $this->generateAtomicLrNumber($companyUuid);
                $generationMode = 'auto';
            }

            // Ensure unique within company
            $exists = LrNumber::withoutGlobalScopes()
                ->where('company_uuid', $companyUuid)
                ->where('lr_number', $lrNumber)
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'lr_number' => ["LR Number {$lrNumber} already exists for this company."],
                ]);
            }

            $initialStatus = self::STATUS_BOOKED;

            $lr = LrNumber::create([
                'uuid'            => (string) Str::uuid(),
                'company_uuid'    => $companyUuid,
                'load_uuid'       => $data['load_uuid'] ?? null,
                'vehicle_uuid'    => $data['vehicle_uuid'] ?? null,
                'driver_uuid'     => $data['driver_uuid'] ?? null,
                'customer_uuid'   => $data['customer_uuid'] ?? null,
                'consignor_uuid'  => $data['consignor_uuid'] ?? null,
                'consignee_uuid'  => $data['consignee_uuid'] ?? null,
                'bilty_uuid'      => $data['bilty_uuid'] ?? null,
                'lr_number'       => $lrNumber,
                'generation_mode' => $generationMode,
                'status'          => $initialStatus,
                'from_location'   => $data['from_location'] ?? null,
                'to_location'     => $data['to_location'] ?? null,
                'lr_date'         => $data['lr_date'] ?? Carbon::today()->toDateString(),
                'remarks'         => $data['remarks'] ?? null,
                'meta'            => $data['meta'] ?? [],
                'created_by_uuid' => $userUuid,
            ]);

            // Create initial status history entry
            LrStatusHistory::create([
                'uuid'            => (string) Str::uuid(),
                'company_uuid'    => $companyUuid,
                'lr_uuid'         => $lr->uuid,
                'from_status'     => null,
                'to_status'       => $initialStatus,
                'remarks'         => 'Initial LR Booked',
                'changed_by_uuid' => $userUuid,
            ]);

            return $lr;
        });
    }

    /**
     * Transition LR status according to strict state machine.
     *
     * @throws ValidationException
     */
    public function transitionStatus(
        LrNumber $lr,
        string $newStatus,
        ?string $remarks = null,
        ?string $userUuid = null
    ): LrNumber {
        $normalizedNewStatus = strtoupper($newStatus);
        $currentStatus = strtoupper($lr->status ?: self::STATUS_BOOKED);

        if ($currentStatus === $normalizedNewStatus) {
            return $lr;
        }

        $allowed = self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];

        if (!in_array($normalizedNewStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => [
                    "Invalid state transition: Cannot transition LR from '{$currentStatus}' to '{$normalizedNewStatus}'.",
                ],
            ]);
        }

        return DB::transaction(function () use ($lr, $currentStatus, $normalizedNewStatus, $remarks, $userUuid) {
            $lr->status = $normalizedNewStatus;
            $lr->updated_by_uuid = $userUuid;
            $lr->save();

            LrStatusHistory::create([
                'uuid'            => (string) Str::uuid(),
                'company_uuid'    => $lr->company_uuid,
                'lr_uuid'         => $lr->uuid,
                'from_status'     => $currentStatus,
                'to_status'       => $normalizedNewStatus,
                'remarks'         => $remarks ?: "Status transition: {$currentStatus} -> {$normalizedNewStatus}",
                'changed_by_uuid' => $userUuid,
            ]);

            return $lr;
        });
    }

    /**
     * Cancel an LR.
     *
     * @throws ValidationException
     */
    public function cancelLr(LrNumber $lr, string $reason, ?string $userUuid = null): LrNumber
    {
        return $this->transitionStatus($lr, self::STATUS_CANCELLED, "Cancellation reason: {$reason}", $userUuid);
    }

    /**
     * Get status history for an LR.
     */
    public function getHistory(LrNumber $lr)
    {
        return LrStatusHistory::where('lr_uuid', $lr->uuid)
            ->orderBy('created_at', 'asc')
            ->get();
    }
}
