<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\LoadLocation;
use App\Services\MultiStopService;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoadLocationController extends FleetOpsController
{
    public $resource = 'load-location';

    protected MultiStopService $multiStopService;

    public function __construct(MultiStopService $multiStopService)
    {
        $this->multiStopService = $multiStopService;
    }

    /**
     * Resolve LoadLocation by ID, UUID or Public ID.
     */
    protected function resolveLocation(string $id): ?LoadLocation
    {
        $companyUuid = session('company', request()->header('Company-Header'));

        return LoadLocation::where(function ($query) use ($id) {
            $query->where('uuid', $id)->orWhere('public_id', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Update location status via state machine.
     */
    public function updateStatus(string $id, Request $request): JsonResponse
    {
        $location = $this->resolveLocation($id);

        if (!$location) {
            return response()->json(['error' => 'Load location not found.'], 404);
        }

        $newStatus = $request->input('status');
        $params = $request->all();
        $params['user_uuid'] = $request->user()?->uuid;

        $updated = $this->multiStopService->transitionStopStatus($location, $newStatus, $params);

        return response()->json([
            'message' => "Load location transitioned to {$updated->status}.",
            'data'    => $updated,
        ]);
    }

    /**
     * Mark location as completed / delivered.
     */
    public function completeLocation(string $id, Request $request): JsonResponse
    {
        $location = $this->resolveLocation($id);

        if (!$location) {
            return response()->json(['error' => 'Load location not found.'], 404);
        }

        $params = $request->all();
        $params['user_uuid'] = $request->user()?->uuid;

        $updated = $this->multiStopService->transitionStopStatus($location, MultiStopService::STATUS_DELIVERED, $params);

        return response()->json([
            'message' => 'Load location marked as completed.',
            'data'    => $updated,
        ]);
    }

    /**
     * Index / Query Records alias.
     */
    public function index(Request $request)
    {
        return $this->queryRecord($request);
    }

    /**
     * Show / Find Record alias.
     */
    public function show(string $id, Request $request)
    {
        return $this->findRecord($id, $request);
    }

    /**
     * Store / Create Record alias.
     */
    public function store(Request $request)
    {
        return $this->createRecord($request);
    }

    /**
     * Update Record alias.
     */
    public function update(string $id, Request $request)
    {
        return $this->updateRecord($id, $request);
    }

    /**
     * Destroy / Delete Record alias.
     */
    public function destroy(string $id, Request $request)
    {
        return $this->deleteRecord($id, $request);
    }
}
