<?php

namespace App\Services;

use App\Models\DeliveryChallan;
use App\Models\GatePass;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QrVerificationService
{
    /**
     * Generate an HMAC SHA-256 signed QR verification token for any document.
     */
    public function generateSignedToken(string $type, Model $model, ?int $expiresInDays = 90): string
    {
        $secret = config('app.key') ?: 'technofay-transport-secret-key-32b';
        $now = Carbon::now();

        $docNumber = match ($type) {
            'gate_pass'        => $model->gate_pass_number ?? $model->public_id,
            'delivery_challan' => $model->challan_number ?? $model->public_id,
            'lr'               => $model->lr_number ?? $model->public_id,
            'bilty'            => $model->bilty_number ?? $model->public_id,
            default            => $model->public_id ?? $model->uuid,
        };

        $payload = [
            'type'            => $type,
            'uuid'            => $model->uuid,
            'document_number' => $docNumber,
            'company_uuid'    => $model->company_uuid ?? '',
            'created_at'      => $model->created_at?->toISOString() ?? $now->toISOString(),
            'expires_at'      => $expiresInDays ? $now->copy()->addDays($expiresInDays)->toISOString() : null,
        ];

        $json = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', $json, $secret);

        return base64_encode($json . '.' . $signature);
    }

    /**
     * Verify an HMAC SHA-256 signed token.
     */
    public function verifySignedToken(string $token): ?array
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
        if (!is_array($data)) {
            return null;
        }

        // Expiry check
        if (!empty($data['expires_at'])) {
            $expiresAt = Carbon::parse($data['expires_at']);
            if (Carbon::now()->isAfter($expiresAt)) {
                return null;
            }
        }

        return $data;
    }

    /**
     * Retrieve public verification payload for a given token.
     * Guaranteed safe for unauthenticated public display without leaking commercial rates.
     */
    public function getPublicVerificationData(string $token): array
    {
        $verified = $this->verifySignedToken($token);
        if (!$verified) {
            return [
                'valid'   => false,
                'status'  => 'invalid',
                'message' => 'Invalid, expired, or tampered QR verification token.',
            ];
        }

        $type = $verified['type'] ?? 'document';
        $uuid = $verified['uuid'] ?? null;
        $companyUuid = $verified['company_uuid'] ?? ($verified['company'] ?? null);

        $companyName = 'Technofay Transport & Logistics';
        if ($companyUuid) {
            $comp = DB::table('companies')->where('uuid', $companyUuid)->first();
            if ($comp && !empty($comp->name)) {
                $companyName = $comp->name;
            }
        }

        return match ($type) {
            'gate_pass' => $this->verifyGatePassPublic($uuid, $verified, $companyName),
            'delivery_challan' => $this->verifyChallanPublic($uuid, $verified, $companyName),
            'lr' => $this->verifyLrPublic($uuid, $verified, $companyName),
            'bilty' => $this->verifyBiltyPublic($uuid, $verified, $companyName),
            default => [
                'valid'           => true,
                'document_type'   => $type,
                'document_number' => $verified['document_number'] ?? 'N/A',
                'status'          => 'verified',
                'company_name'    => $companyName,
                'verified_at'     => Carbon::now()->toIso8601String(),
            ],
        };
    }

    /**
     * Resolve Gate Pass public verification.
     */
    protected function verifyGatePassPublic(?string $uuid, array $tokenData, string $companyName): array
    {
        $pass = GatePass::withoutGlobalScopes()->where('uuid', $uuid)->first();
        if (!$pass) {
            return [
                'valid'   => false,
                'status'  => 'not_found',
                'message' => 'Gate pass record was not found or has been revoked.',
            ];
        }

        $pass->loadMissing(['vehicle', 'driver']);

        $status = 'issued';
        if ($pass->out_time) {
            $status = 'exited';
        } elseif ($pass->in_time) {
            $status = 'active';
        }

        return [
            'valid'           => true,
            'document_type'   => 'gate_pass',
            'document_number' => $pass->gate_pass_number,
            'status'          => $status,
            'pass_type'       => $pass->pass_type === 'out' ? 'Outward' : ($pass->pass_type === 'in' ? 'Inward' : 'Both'),
            'vehicle_plate'   => $pass->vehicle?->plate_number ?? 'Unassigned',
            'driver_name'     => $pass->driver?->name ?? 'Unassigned',
            'company_name'    => $companyName,
            'issued_at'       => $pass->created_at?->toIso8601String(),
            'verified_at'     => Carbon::now()->toIso8601String(),
            'details'         => [
                'authorized_by' => $pass->authorized_by,
                'security_name' => $pass->security_name,
                'in_time'       => $pass->in_time?->toIso8601String(),
                'out_time'      => $pass->out_time?->toIso8601String(),
            ],
        ];
    }

    /**
     * Resolve Delivery Challan public verification.
     */
    protected function verifyChallanPublic(?string $uuid, array $tokenData, string $companyName): array
    {
        $challan = DeliveryChallan::withoutGlobalScopes()->where('uuid', $uuid)->first();
        if (!$challan) {
            return [
                'valid'   => false,
                'status'  => 'not_found',
                'message' => 'Delivery challan record was not found or has been revoked.',
            ];
        }

        $challan->loadMissing(['vehicle', 'driver', 'consignee']);

        return [
            'valid'           => true,
            'document_type'   => 'delivery_challan',
            'document_number' => $challan->challan_number,
            'status'          => $challan->status,
            'vehicle_plate'   => $challan->vehicle?->plate_number ?? 'Unassigned',
            'driver_name'     => $challan->driver?->name ?? 'Unassigned',
            'consignee_name'  => $challan->consignee?->name ?? 'Consignee on record',
            'company_name'    => $companyName,
            'issued_at'       => $challan->created_at?->toIso8601String(),
            'verified_at'     => Carbon::now()->toIso8601String(),
            'details'         => [
                'total_weight'   => $challan->total_weight,
                'total_quantity' => $challan->total_quantity,
                'delivered_at'   => $challan->delivered_at?->toIso8601String(),
                'received_by'    => $challan->received_by,
            ],
        ];
    }

    /**
     * Resolve LR public verification.
     */
    protected function verifyLrPublic(?string $uuid, array $tokenData, string $companyName): array
    {
        $lr = DB::table('lr_numbers')->where('uuid', $uuid)->first();
        if (!$lr) {
            return [
                'valid'   => false,
                'status'  => 'not_found',
                'message' => 'LR record was not found or has been revoked.',
            ];
        }

        return [
            'valid'           => true,
            'document_type'   => 'lr',
            'document_number' => $lr->lr_number,
            'status'          => $lr->status ?? 'issued',
            'company_name'    => $companyName,
            'issued_at'       => $lr->created_at ?? null,
            'verified_at'     => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Resolve Bilty public verification.
     */
    protected function verifyBiltyPublic(?string $uuid, array $tokenData, string $companyName): array
    {
        $bilty = DB::table('bilties')->where('uuid', $uuid)->first();
        if (!$bilty) {
            return [
                'valid'   => false,
                'status'  => 'not_found',
                'message' => 'Bilty record was not found or has been revoked.',
            ];
        }

        return [
            'valid'           => true,
            'document_type'   => 'bilty',
            'document_number' => $bilty->bilty_number,
            'status'          => $bilty->status ?? 'active',
            'company_name'    => $companyName,
            'issued_at'       => $bilty->created_at ?? null,
            'verified_at'     => Carbon::now()->toIso8601String(),
        ];
    }
}
