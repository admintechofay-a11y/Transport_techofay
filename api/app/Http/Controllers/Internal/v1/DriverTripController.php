<?php

namespace App\Http\Controllers\Internal\v1;

use App\Services\DriverTripService;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverTripController extends FleetOpsController
{
    public $resource = 'trip';

    public $service;

    public function __construct(DriverTripService $service)
    {
        $this->service = $service;
    }

    protected function resolveDriverUuid(Request $request): ?string
    {
        return $request->input('driver_uuid')
            ?? $request->header('Driver-Uuid')
            ?? $request->header('X-Driver-Uuid')
            ?? auth()->user()?->driver_uuid
            ?? auth()->user()?->uuid;
    }

    protected function resolveCompanyUuid(Request $request): ?string
    {
        return session('company')
            ?? $request->header('Company-Header')
            ?? $request->header('Company-Uuid')
            ?? auth()->user()?->company_uuid;
    }

    /**
     * List driver trips.
     */
    public function trips(Request $request): JsonResponse
    {
        $driverUuid = $this->resolveDriverUuid($request);
        $companyUuid = $this->resolveCompanyUuid($request);

        $trips = $this->service->listDriverTrips($driverUuid, $companyUuid, $request->all());

        return response()->json($trips);
    }

    /**
     * Show trip details.
     */
    public function tripDetails(Request $request, string $id): JsonResponse
    {
        $driverUuid = $this->resolveDriverUuid($request);
        $companyUuid = $this->resolveCompanyUuid($request);

        $trip = $this->service->resolveTrip($id, $companyUuid, $driverUuid);

        return response()->json(['trip' => $trip]);
    }

    /**
     * Driver accepts trip.
     */
    public function acceptTrip(Request $request, string $id): JsonResponse
    {
        $driverUuid = $this->resolveDriverUuid($request);
        $companyUuid = $this->resolveCompanyUuid($request);

        $trip = $this->service->acceptTrip($id, $driverUuid, $companyUuid);

        return response()->json([
            'trip'    => $trip,
            'message' => 'Trip accepted successfully.',
        ]);
    }

    /**
     * Driver starts trip.
     */
    public function startTrip(Request $request, string $id): JsonResponse
    {
        $driverUuid = $this->resolveDriverUuid($request);
        $companyUuid = $this->resolveCompanyUuid($request);

        $trip = $this->service->startTrip($id, $driverUuid, $companyUuid);

        return response()->json([
            'trip'    => $trip,
            'message' => 'Trip started successfully.',
        ]);
    }

    /**
     * Driver starts stop (arrival/loading/unloading).
     */
    public function startStop(Request $request, string $id): JsonResponse
    {
        $driverUuid = $this->resolveDriverUuid($request);
        $companyUuid = $this->resolveCompanyUuid($request);
        $stopId = $request->input('stop_id') ?? $request->input('stop_uuid') ?? $request->input('id');

        if (!$stopId) {
            return response()->json(['message' => 'Stop ID (stop_id) is required.'], 400);
        }

        $result = $this->service->startStop($id, $stopId, $driverUuid, $companyUuid, $request->all());

        return response()->json([
            'trip'    => $result['order'],
            'stop'    => $result['stop'],
            'message' => 'Stop started successfully.',
        ]);
    }

    /**
     * Driver completes stop (loaded/delivered).
     */
    public function completeStop(Request $request, string $id): JsonResponse
    {
        $driverUuid = $this->resolveDriverUuid($request);
        $companyUuid = $this->resolveCompanyUuid($request);
        $stopId = $request->input('stop_id') ?? $request->input('stop_uuid') ?? $request->input('id');

        if (!$stopId) {
            return response()->json(['message' => 'Stop ID (stop_id) is required.'], 400);
        }

        $result = $this->service->completeStop($id, $stopId, $driverUuid, $companyUuid, $request->all());

        return response()->json([
            'trip'    => $result['order'],
            'stop'    => $result['stop'],
            'message' => 'Stop completed successfully.',
        ]);
    }

    /**
     * Driver completes trip.
     */
    public function completeTrip(Request $request, string $id): JsonResponse
    {
        $driverUuid = $this->resolveDriverUuid($request);
        $companyUuid = $this->resolveCompanyUuid($request);

        $trip = $this->service->completeTrip($id, $driverUuid, $companyUuid, $request->all());

        return response()->json([
            'trip'    => $trip,
            'message' => 'Trip completed successfully.',
        ]);
    }
}
