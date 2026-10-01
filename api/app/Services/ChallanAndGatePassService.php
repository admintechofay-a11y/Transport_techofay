<?php

namespace App\Services;

use App\Models\DeliveryChallan;
use App\Models\GatePass;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ChallanAndGatePassService
{
    /**
     * Generate atomic, sequential Delivery Challan number (DC-YYYY-000001).
     */
    public function generateAtomicChallanNumber(string $companyUuid, ?int $year = null): string
    {
        $year = $year ?: (int) Carbon::now()->format('Y');

        return DB::transaction(function () use ($companyUuid, $year) {
            $count = DB::table('delivery_challans')
                ->where('company_uuid', $companyUuid)
                ->whereYear('created_at', $year)
                ->count();

            $next = $count + 1;
            $candidate = sprintf('DC-%04d-%06d', $year, $next);

            while (DB::table('delivery_challans')->where('challan_number', $candidate)->exists()) {
                $next++;
                $candidate = sprintf('DC-%04d-%06d', $year, $next);
            }

            return $candidate;
        });
    }

    /**
     * Generate atomic, sequential Gate Pass number (GP-YYYY-000001).
     */
    public function generateAtomicGatePassNumber(string $companyUuid, ?int $year = null): string
    {
        $year = $year ?: (int) Carbon::now()->format('Y');

        return DB::transaction(function () use ($companyUuid, $year) {
            $count = DB::table('gate_passes')
                ->where('company_uuid', $companyUuid)
                ->whereYear('created_at', $year)
                ->count();

            $next = $count + 1;
            $candidate = sprintf('GP-%04d-%06d', $year, $next);

            while (DB::table('gate_passes')->where('gate_pass_number', $candidate)->exists()) {
                $next++;
                $candidate = sprintf('GP-%04d-%06d', $year, $next);
            }

            return $candidate;
        });
    }

    /**
     * Create a new Delivery Challan.
     */
    public function createDeliveryChallan(array $data, ?string $userUuid = null, ?string $companyUuid = null): DeliveryChallan
    {
        $companyUuid = $companyUuid ?: session('company', request()->header('Company-Header'));
        if (!$companyUuid) {
            $companyUuid = (string) Str::uuid();
        }

        $challanNumber = $data['challan_number'] ?? null;
        if (empty($challanNumber)) {
            $challanNumber = $this->generateAtomicChallanNumber($companyUuid);
        }

        $status = $data['status'] ?? 'pending';
        $deliveredAt = null;
        if ($status === 'delivered') {
            $deliveredAt = isset($data['delivered_at']) ? Carbon::parse($data['delivered_at']) : Carbon::now();
        }

        $challan = new DeliveryChallan();
        $challan->uuid = (string) Str::uuid();
        $challan->company_uuid = $companyUuid;
        $challan->load_uuid = $data['load_uuid'] ?? null;
        $challan->load_location_uuid = $data['load_location_uuid'] ?? null;
        $challan->vehicle_uuid = $data['vehicle_uuid'] ?? null;
        $challan->driver_uuid = $data['driver_uuid'] ?? null;
        $challan->consignee_uuid = $data['consignee_uuid'] ?? null;
        $challan->challan_number = $challanNumber;
        $challan->challan_date = $data['challan_date'] ?? Carbon::now()->toDateString();
        $challan->material_items = $data['material_items'] ?? null;
        $challan->total_quantity = $data['total_quantity'] ?? null;
        $challan->total_weight = $data['total_weight'] ?? null;
        $challan->status = $status;
        $challan->delivered_at = $deliveredAt;
        $challan->received_by = $data['received_by'] ?? null;
        $challan->remarks = $data['remarks'] ?? null;
        $challan->save();

        return $challan;
    }

    /**
     * Transition Delivery Challan status.
     */
    public function updateChallanStatus(DeliveryChallan $challan, string $status, array $extra = []): DeliveryChallan
    {
        $validStatuses = ['pending', 'delivered', 'partial', 'returned'];
        if (!in_array($status, $validStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => ["Invalid status '{$status}'. Allowed: " . implode(', ', $validStatuses)],
            ]);
        }

        $challan->status = $status;
        if (in_array($status, ['delivered', 'partial'], true)) {
            $challan->delivered_at = Carbon::now();
            if (!empty($extra['received_by'])) {
                $challan->received_by = $extra['received_by'];
            }
        }
        if (!empty($extra['remarks'])) {
            $challan->remarks = $extra['remarks'];
        }

        $challan->save();

        return $challan;
    }

    /**
     * Create a new Gate Pass with HMAC signed QR token.
     */
    public function createGatePass(array $data, ?string $userUuid = null, ?string $companyUuid = null): GatePass
    {
        $companyUuid = $companyUuid ?: session('company', request()->header('Company-Header'));
        if (!$companyUuid) {
            $companyUuid = (string) Str::uuid();
        }

        $passNumber = $data['gate_pass_number'] ?? null;
        if (empty($passNumber)) {
            $passNumber = $this->generateAtomicGatePassNumber($companyUuid);
        }

        $passType = $data['pass_type'] ?? 'out';
        $now = Carbon::now();

        $inTime = null;
        $outTime = null;

        if ($passType === 'in' || $passType === 'both') {
            $inTime = isset($data['in_time']) ? Carbon::parse($data['in_time']) : $now;
        }
        if ($passType === 'out' || $passType === 'both') {
            $outTime = isset($data['out_time']) ? Carbon::parse($data['out_time']) : $now;
        }

        $gatePass = new GatePass();
        $gatePass->uuid = (string) Str::uuid();
        $gatePass->company_uuid = $companyUuid;
        $gatePass->load_uuid = $data['load_uuid'] ?? null;
        $gatePass->vehicle_uuid = $data['vehicle_uuid'] ?? null;
        $gatePass->driver_uuid = $data['driver_uuid'] ?? null;
        $gatePass->gate_pass_number = $passNumber;
        $gatePass->pass_type = $passType;
        $gatePass->in_time = $inTime;
        $gatePass->out_time = $outTime;
        $gatePass->authorized_by = $data['authorized_by'] ?? null;
        $gatePass->security_name = $data['security_name'] ?? null;
        $gatePass->remarks = $data['remarks'] ?? null;

        // Generate signed QR token
        $gatePass->qr_token = $this->generateHmacSignedQrToken($gatePass);
        $gatePass->save();

        return $gatePass;
    }

    /**
     * Record gate exit for inward or both pass.
     */
    public function recordGatePassExit(GatePass $gatePass, ?Carbon $outTime = null): GatePass
    {
        $gatePass->out_time = $outTime ?: Carbon::now();
        $gatePass->save();

        return $gatePass;
    }

    /**
     * Generate HMAC signed QR token for tamper-proof gate pass verification.
     */
    public function generateHmacSignedQrToken(GatePass $gatePass): string
    {
        $secret = config('app.key') ?: 'technofay-transport-secret-key-32b';
        $payload = [
            'type'        => 'gate_pass',
            'uuid'        => $gatePass->uuid,
            'pass_number' => $gatePass->gate_pass_number,
            'pass_type'   => $gatePass->pass_type,
            'company'     => $gatePass->company_uuid,
            'vehicle'     => $gatePass->vehicle_uuid,
            'driver'      => $gatePass->driver_uuid,
            'created_at'  => $gatePass->created_at?->toISOString() ?? Carbon::now()->toISOString(),
        ];
        $json = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', $json, $secret);

        return base64_encode($json . '.' . $signature);
    }

    /**
     * Verify an HMAC signed QR token.
     */
    public function verifyHmacSignedQrToken(string $token): ?array
    {
        $decoded = base64_decode($token, true);
        if (!$decoded || !str_contains($decoded, '.')) {
            return null;
        }

        $lastDotPos = strrpos($decoded, '.');
        $json = substr($decoded, 0, $lastDotPos);
        $signature = substr($decoded, $lastDotPos + 1);

        $secret = config('app.key') ?: 'technofay-transport-secret-key-32b';
        $expectedSig = hash_hmac('sha256', $json, $secret);

        if (!hash_equals($expectedSig, $signature)) {
            return null;
        }

        $data = json_decode($json, true);

        return is_array($data) ? $data : null;
    }
}
