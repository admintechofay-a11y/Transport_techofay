<?php

namespace App\Services;

use App\Models\LoadLocation;
use App\Models\Order;
use App\Models\Proof;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProofOfDeliveryService
{
    /**
     * Submit Proof of Delivery (POD) for an order/load.
     * Records receiver acknowledgment, GPS coordinates, signature/photo,
     * and transitions order status to delivered.
     */
    public function createPod(array $data, ?string $companyUuid = null): Proof
    {
        $companyUuid = $companyUuid ?: session('company', request()->header('Company-Header'));
        if (!$companyUuid) {
            $companyUuid = (string) Str::uuid();
        }

        $orderId = $data['order_uuid'] ?? ($data['order_id'] ?? ($data['subject_uuid'] ?? null));
        $order = null;

        if ($orderId) {
            $order = Order::withoutGlobalScopes()->where(function ($q) use ($orderId) {
                $q->where('uuid', $orderId)
                    ->orWhere('public_id', $orderId)
                    ->orWhere('load_number', $orderId);
            })->first();
        }

        $now = Carbon::now();
        $deliveryDate = !empty($data['delivery_date']) ? Carbon::parse($data['delivery_date']) : $now;

        $proofData = [
            'receiver_name'      => $data['receiver_name'] ?? ($data['received_by'] ?? 'Receiver'),
            'receiver_phone'     => $data['receiver_phone'] ?? null,
            'delivery_date'      => $deliveryDate->toIso8601String(),
            'packages_condition' => $data['packages_condition'] ?? 'Good & Sound Condition (Seals Intact)',
            'latitude'           => isset($data['latitude']) ? (float) $data['latitude'] : null,
            'longitude'          => isset($data['longitude']) ? (float) $data['longitude'] : null,
            'photo_url'          => $data['photo_url'] ?? ($data['file_url'] ?? null),
            'signature_url'      => $data['signature_url'] ?? null,
            'status'             => 'verified',
        ];

        $proof = new Proof();
        $proof->uuid = (string) Str::uuid();
        $proof->company_uuid = $companyUuid;
        $proof->order_uuid = $order?->uuid ?? $orderId;
        $proof->subject_uuid = $order?->uuid ?? $orderId;
        $proof->subject_type = Order::class;
        $proof->remarks = $data['remarks'] ?? 'Physical inspection completed and POD verified.';
        $proof->data = $proofData;
        $proof->save();

        // Transition Order / Load status to delivered
        if ($order) {
            DB::table('orders')->where('uuid', $order->uuid)->update([
                'status'       => 'delivered',
                'delivered_at' => $now,
            ]);
            $order->status = 'delivered';
            $order->delivered_at = $now;

            // Update any dropoff LoadLocation waypoints to delivered
            LoadLocation::withoutGlobalScopes()
                ->where('load_uuid', $order->uuid)
                ->whereIn('stop_type', ['dropoff', 'unloading', 'destination'])
                ->update([
                    'status'       => 'delivered',
                    'completed_at' => $now,
                ]);
        }

        return $proof;
    }

    /**
     * Get proofs for a specific order / load.
     */
    public function getProofsForOrder(string $orderId, ?string $companyUuid = null): Collection
    {
        $query = Proof::withoutGlobalScopes()->where(function ($q) use ($orderId) {
            $q->where('order_uuid', $orderId)
                ->orWhere('subject_uuid', $orderId);
        });

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        return $query->latest()->get();
    }

    /**
     * List all PODs with filtering and pagination.
     */
    public function listProofs(array $filters = [], ?string $companyUuid = null, int $limit = 15): LengthAwarePaginator
    {
        $companyUuid = $companyUuid ?: session('company', request()->header('Company-Header'));

        $query = Proof::with(['order']);

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        if (!empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(function ($q) use ($term) {
                $q->where('remarks', 'like', "%{$term}%")
                    ->orWhere('public_id', 'like', "%{$term}%");
            });
        }

        return $query->latest()->paginate($limit);
    }
}
