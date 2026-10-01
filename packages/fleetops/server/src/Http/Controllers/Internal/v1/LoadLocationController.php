<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\LoadLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoadLocationController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'load-location';

    /**
     * Resolve LoadLocation by ID, UUID or Public ID.
     */
    protected function resolveLocation(string $id): ?LoadLocation
    {
        $companyUuid = session('company');

        return LoadLocation::where(function ($query) use ($id) {
            $query->where('uuid', $id)->orWhere('public_id', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Mark location as completed.
     */
    public function completeLocation(string $id, Request $request): JsonResponse
    {
        $location = $this->resolveLocation($id);

        if (!$location) {
            return response()->json(['error' => 'Load location not found.'], 404);
        }

        $location->status = 'delivered';
        $location->completed_at = now();
        $location->completed_by_uuid = $request->user()?->uuid;
        if ($request->has('remarks')) {
            $location->remarks = $request->input('remarks');
        }
        $location->save();

        return response()->json([
            'message' => 'Load location marked as completed.',
            'data'    => $location,
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
