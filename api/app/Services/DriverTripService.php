<?php

namespace App\Services;

use App\Models\LoadLocation;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DriverTripService
{
    /**
     * Resolve Order by ID or UUID with company and driver checks.
     */
    public function resolveTrip(string $id, ?string $companyUuid = null, ?string $driverUuid = null): Order
    {
        $query = Order::withoutGlobalScopes()
            ->where(function ($q) use ($id) {
                $q->where('uuid', $id)
                    ->orWhere('public_id', $id)
                    ->orWhere('id', $id);
            });

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        $order = $query->with(['locations', 'driver', 'vehicle'])->first();

        if (!$order) {
            throw new HttpException(404, 'Trip not found or does not belong to your company.');
        }

        if ($driverUuid && $order->driver_assigned_uuid && $order->driver_assigned_uuid !== $driverUuid) {
            throw new HttpException(403, 'This trip is assigned to a different driver.');
        }

        return $order;
    }

    /**
     * List trips assigned to a driver.
     */
    public function listDriverTrips(?string $driverUuid, ?string $companyUuid, array $filters = []): LengthAwarePaginator|Collection
    {
        $query = Order::withoutGlobalScopes();

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        if ($driverUuid) {
            $query->where('driver_assigned_uuid', $driverUuid);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        } elseif (isset($filters['active']) && $filters['active']) {
            $query->whereNotIn('status', ['completed', 'cancelled', 'closed']);
        }

        $query->with(['locations', 'driver', 'vehicle'])
            ->orderBy('created_at', 'desc');

        $limit = (int) ($filters['limit'] ?? 15);

        return $query->paginate($limit);
    }

    /**
     * Driver accepts an assigned trip.
     */
    public function acceptTrip(string $tripId, ?string $driverUuid, ?string $companyUuid): Order
    {
        $order = $this->resolveTrip($tripId, $companyUuid, $driverUuid);

        if (in_array($order->status, ['completed', 'cancelled'])) {
            throw new HttpException(422, "Cannot accept trip in '{$order->status}' status.");
        }

        $now = Carbon::now();
        $meta = is_array($order->meta) ? $order->meta : (json_decode($order->meta ?? '{}', true) ?: []);
        $meta['driver_accepted_at'] = $now->toIso8601String();

        $updates = [
            'status' => 'driver_accepted',
            'meta'   => json_encode($meta),
        ];

        // If driver was unassigned, assign this driver
        if (!$order->driver_assigned_uuid && $driverUuid) {
            $updates['driver_assigned_uuid'] = $driverUuid;
        }

        DB::table('orders')->where('uuid', $order->uuid)->update($updates);

        return $this->resolveTrip($order->uuid, $companyUuid);
    }

    /**
     * Driver starts the trip.
     */
    public function startTrip(string $tripId, ?string $driverUuid, ?string $companyUuid): Order
    {
        $order = $this->resolveTrip($tripId, $companyUuid, $driverUuid);

        if (in_array($order->status, ['completed', 'cancelled'])) {
            throw new HttpException(422, "Cannot start trip in '{$order->status}' status.");
        }

        $now = Carbon::now();
        $meta = is_array($order->meta) ? $order->meta : (json_decode($order->meta ?? '{}', true) ?: []);
        $meta['trip_started_at'] = $now->toIso8601String();

        $updates = [
            'status'     => 'in_transit',
            'started'    => true,
            'started_at' => $now,
            'meta'       => json_encode($meta),
        ];

        DB::table('orders')->where('uuid', $order->uuid)->update($updates);

        // Optionally progress first pending stop
        $firstStop = LoadLocation::withoutGlobalScopes()
            ->where('load_uuid', $order->uuid)
            ->where('status', 'pending')
            ->orderBy('sequence', 'asc')
            ->first();

        if ($firstStop && $firstStop->location_type === 'pickup') {
            DB::table('load_locations')
                ->where('uuid', $firstStop->uuid)
                ->update(['status' => 'loading']);
        }

        return $this->resolveTrip($order->uuid, $companyUuid);
    }

    /**
     * Driver starts action on a stop (e.g. arrived / loading / unloading).
     */
    public function startStop(string $tripId, string $stopId, ?string $driverUuid, ?string $companyUuid, array $data = []): array
    {
        $order = $this->resolveTrip($tripId, $companyUuid, $driverUuid);

        $stop = LoadLocation::withoutGlobalScopes()
            ->where('load_uuid', $order->uuid)
            ->where(function ($q) use ($stopId) {
                $q->where('uuid', $stopId)
                    ->orWhere('public_id', $stopId)
                    ->orWhere('id', $stopId);
            })
            ->first();

        if (!$stop) {
            throw new HttpException(404, 'Stop location not found for this trip.');
        }

        $targetStatus = $data['status'] ?? ($stop->location_type === 'pickup' ? 'loading' : 'in_transit');

        $updates = [
            'status' => $targetStatus,
        ];

        if (!empty($data['remarks'])) {
            $updates['remarks'] = $data['remarks'];
        }

        DB::table('load_locations')->where('uuid', $stop->uuid)->update($updates);

        $refreshedOrder = $this->resolveTrip($order->uuid, $companyUuid);
        $refreshedStop = LoadLocation::withoutGlobalScopes()->where('uuid', $stop->uuid)->first();

        return [
            'order' => $refreshedOrder,
            'stop'  => $refreshedStop,
        ];
    }

    /**
     * Driver completes a stop (loaded / delivered).
     */
    public function completeStop(string $tripId, string $stopId, ?string $driverUuid, ?string $companyUuid, array $data = []): array
    {
        $order = $this->resolveTrip($tripId, $companyUuid, $driverUuid);

        $stop = LoadLocation::withoutGlobalScopes()
            ->where('load_uuid', $order->uuid)
            ->where(function ($q) use ($stopId) {
                $q->where('uuid', $stopId)
                    ->orWhere('public_id', $stopId)
                    ->orWhere('id', $stopId);
            })
            ->first();

        if (!$stop) {
            throw new HttpException(404, 'Stop location not found for this trip.');
        }

        $now = Carbon::now();
        $targetStatus = $data['status'] ?? ($stop->location_type === 'pickup' ? 'loaded' : 'delivered');

        $updates = [
            'status'             => $targetStatus,
            'completed_at'       => $now,
            'completed_by_uuid'  => $driverUuid,
        ];

        if (!empty($data['remarks'])) {
            $updates['remarks'] = $data['remarks'];
        }

        DB::table('load_locations')->where('uuid', $stop->uuid)->update($updates);

        $refreshedOrder = $this->resolveTrip($order->uuid, $companyUuid);
        $refreshedStop = LoadLocation::withoutGlobalScopes()->where('uuid', $stop->uuid)->first();

        return [
            'order' => $refreshedOrder,
            'stop'  => $refreshedStop,
        ];
    }

    /**
     * Driver completes the entire trip.
     */
    public function completeTrip(string $tripId, ?string $driverUuid, ?string $companyUuid, array $data = []): Order
    {
        $order = $this->resolveTrip($tripId, $companyUuid, $driverUuid);

        $now = Carbon::now();
        $meta = is_array($order->meta) ? $order->meta : (json_decode($order->meta ?? '{}', true) ?: []);
        $meta['trip_completed_at'] = $now->toIso8601String();

        if (!empty($data['odometer_end'])) {
            $meta['odometer_end'] = $data['odometer_end'];
        }
        if (!empty($data['remarks'])) {
            $meta['completion_remarks'] = $data['remarks'];
        }

        $updates = [
            'status'       => 'completed',
            'delivered_at' => $now,
            'meta'         => json_encode($meta),
        ];

        DB::table('orders')->where('uuid', $order->uuid)->update($updates);

        // Mark any remaining delivery stops as delivered
        DB::table('load_locations')
            ->where('load_uuid', $order->uuid)
            ->where('location_type', 'delivery')
            ->whereNotIn('status', ['delivered', 'skipped'])
            ->update([
                'status'            => 'delivered',
                'completed_at'      => $now,
                'completed_by_uuid' => $driverUuid,
            ]);

        return $this->resolveTrip($order->uuid, $companyUuid);
    }
}
