<?php

namespace App\Services;

use App\Models\Bilty;
use App\Models\BiltySequence;
use App\Models\LrNumber;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BiltyDomainService
{
    /**
     * Concurrency-safe, atomic sequential Bilty number generation.
     * Uses DB transaction and lockForUpdate on bilty_sequences.
     */
    public function generateAtomicBiltyNumber(string $companyUuid, ?int $year = null): string
    {
        $year = $year ?: (int) Carbon::now()->format('Y');

        return DB::transaction(function () use ($companyUuid, $year) {
            if (DB::getSchemaBuilder()->hasTable('bilty_sequences')) {
                // Ensure sequence row exists
                $existing = DB::table('bilty_sequences')
                    ->where('company_uuid', $companyUuid)
                    ->where('year', $year)
                    ->first();

                if (!$existing) {
                    $maxInBiltyTable = DB::table('bilties')
                        ->where('company_uuid', $companyUuid)
                        ->whereYear('created_at', $year)
                        ->count();

                    DB::table('bilty_sequences')->insert([
                        'company_uuid'     => $companyUuid,
                        'year'             => $year,
                        'current_sequence' => $maxInBiltyTable,
                        'created_at'       => Carbon::now(),
                        'updated_at'       => Carbon::now(),
                    ]);
                }

                // Row-level lock
                $sequenceRecord = BiltySequence::where('company_uuid', $companyUuid)
                    ->where('year', $year)
                    ->lockForUpdate()
                    ->first();

                $nextSeq = ($sequenceRecord ? $sequenceRecord->current_sequence : 0) + 1;

                if ($sequenceRecord) {
                    $sequenceRecord->current_sequence = $nextSeq;
                    $sequenceRecord->save();
                } else {
                    DB::table('bilty_sequences')
                        ->where('company_uuid', $companyUuid)
                        ->where('year', $year)
                        ->update(['current_sequence' => $nextSeq]);
                }

                return sprintf('BL-%d-%06d', $year, $nextSeq);
            }

            // Fallback for environments where sequence table has not been migrated
            $lastCount = DB::table('bilties')
                ->where('company_uuid', $companyUuid)
                ->whereYear('created_at', $year)
                ->count();

            return sprintf('BL-%d-%06d', $year, $lastCount + 1);
        });
    }

    /**
     * Create a new Bilty record with atomic number assignment and full persistence.
     */
    public function createBilty(array $data, ?string $userUuid = null): Bilty
    {
        $companyUuid = $data['company_uuid'] ?? session('company') ?? request()->header('Company-Header');

        if (!$companyUuid) {
            throw ValidationException::withMessages([
                'company_uuid' => 'A valid company context is required to create a Bilty.',
            ]);
        }

        // Auto-assign atomic sequential bilty_number if not provided
        if (empty($data['bilty_number'])) {
            $year = !empty($data['bilty_date']) ? (int) Carbon::parse($data['bilty_date'])->format('Y') : null;
            $data['bilty_number'] = $this->generateAtomicBiltyNumber($companyUuid, $year);
        } else {
            // Verify uniqueness
            $exists = Bilty::where('company_uuid', $companyUuid)
                ->where('bilty_number', $data['bilty_number'])
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'bilty_number' => "Bilty number {$data['bilty_number']} already exists for this organization.",
                ]);
            }
        }

        // If lr_uuid is provided, pull missing fields from the LR
        if (!empty($data['lr_uuid'])) {
            $lr = LrNumber::where('uuid', $data['lr_uuid'])
                ->orWhere('public_id', $data['lr_uuid'])
                ->first();

            if ($lr) {
                $data['lr_uuid'] = $lr->uuid;
                $data['load_uuid'] = $data['load_uuid'] ?? $lr->load_uuid;
                $data['vehicle_uuid'] = $data['vehicle_uuid'] ?? $lr->vehicle_uuid;
                $data['driver_uuid'] = $data['driver_uuid'] ?? $lr->driver_uuid;
                $data['customer_uuid'] = $data['customer_uuid'] ?? $lr->customer_uuid;
                $data['consignor_uuid'] = $data['consignor_uuid'] ?? $lr->consignor_uuid;
                $data['consignee_uuid'] = $data['consignee_uuid'] ?? $lr->consignee_uuid;
                $data['from_location'] = $data['from_location'] ?? $lr->from_location;
                $data['to_location'] = $data['to_location'] ?? $lr->to_location;
            }
        }

        $freight = (float) ($data['freight_amount'] ?? 0);
        $advance = (float) ($data['advance_amount'] ?? 0);
        $balance = max(0.0, round($freight - $advance, 2));

        $bilty = new Bilty();
        $bilty->uuid = $data['uuid'] ?? (string) Str::uuid();
        $bilty->company_uuid = $companyUuid;
        $bilty->bilty_number = $data['bilty_number'];
        $bilty->bilty_date = !empty($data['bilty_date']) ? Carbon::parse($data['bilty_date']) : Carbon::now();
        $bilty->lr_uuid = $data['lr_uuid'] ?? null;
        $bilty->load_uuid = $data['load_uuid'] ?? null;
        $bilty->vehicle_uuid = $data['vehicle_uuid'] ?? null;
        $bilty->driver_uuid = $data['driver_uuid'] ?? null;
        $bilty->customer_uuid = $data['customer_uuid'] ?? null;
        $bilty->consignor_uuid = $data['consignor_uuid'] ?? null;
        $bilty->consignee_uuid = $data['consignee_uuid'] ?? null;
        $bilty->from_location = $data['from_location'] ?? null;
        $bilty->to_location = $data['to_location'] ?? null;
        $bilty->material_details = $data['material_details'] ?? null;
        $bilty->total_weight = isset($data['total_weight']) ? (float) $data['total_weight'] : null;
        $bilty->freight_amount = $freight;
        $bilty->advance_amount = $advance;
        $bilty->balance_amount = $balance;
        $bilty->payment_terms = $data['payment_terms'] ?? 'to_pay';
        $bilty->remarks = $data['remarks'] ?? null;
        $bilty->authorized_by = $data['authorized_by'] ?? null;
        $bilty->meta = $data['meta'] ?? [];
        $bilty->created_by_uuid = $userUuid;

        $bilty->save();

        // If lr_uuid was linked, link back
        if (!empty($bilty->lr_uuid)) {
            $lr = LrNumber::where('uuid', $bilty->lr_uuid)->first();
            if ($lr && empty($lr->bilty_uuid)) {
                $lr->bilty_uuid = $bilty->uuid;
                $lr->saveQuietly();
            }
        }

        return $bilty;
    }

    /**
     * Resolve a Bilty by ID, UUID, public_id or bilty_number.
     */
    public function resolveBilty(string $id, ?string $companyUuid = null): ?Bilty
    {
        $companyUuid = $companyUuid ?: (session('company') ?: request()->header('Company-Header'));

        return Bilty::where(function ($query) use ($id) {
            $query->where('uuid', $id)
                ->orWhere('public_id', $id)
                ->orWhere('bilty_number', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }
}
