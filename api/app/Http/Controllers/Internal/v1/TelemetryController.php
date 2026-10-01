<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\Position;
use App\Scopes\CompanyScope;
use App\Services\TelemetryService;
use Fleetbase\Http\Controllers\FleetbaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TelemetryController extends FleetbaseController
{
    protected TelemetryService $telemetryService;

    public function __construct(TelemetryService $telemetryService)
    {
        $this->telemetryService = $telemetryService;
        // Prevent default FleetbaseController from calling setApiModel()
    }

    /**
     * Ingest single or batch telemetry data.
     */
    public function ingest(Request $request): JsonResponse
    {
        $companyUuid = CompanyScope::resolveCompanyUuid()
            ?? session('company')
            ?? $request->header('X-Company-Uuid')
            ?? $request->input('company');

        // Extract device token if provided via headers
        $bearerToken = $request->bearerToken();
        $deviceToken = $request->header('X-Device-Token') ?? $bearerToken;

        $input = $request->all();
        if ($deviceToken && !isset($input['device_token'])) {
            $input['device_token'] = $deviceToken;
        }

        try {
            // Check if batch ingestion
            if (isset($input['positions']) && is_array($input['positions'])) {
                $result = $this->telemetryService->batchIngest($input['positions'], $companyUuid);
                return response()->json($result, 201);
            }

            $result = $this->telemetryService->ingest($input, $companyUuid);
            return response()->json($result, 201);
        } catch (ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Telemetry ingestion failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get latest telemetry positions for active fleet map with company isolation.
     */
    public function latest(Request $request): JsonResponse
    {
        $companyUuid = CompanyScope::resolveCompanyUuid()
            ?? session('company')
            ?? $request->header('X-Company-Uuid')
            ?? $request->input('company');

        if (!$companyUuid) {
            return response()->json([
                'errors' => ['Company context is required to query fleet telemetry.']
            ], 403);
        }

        $query = Position::where('company_uuid', $companyUuid);

        if ($request->has('vehicle_uuid')) {
            $query->where('subject_uuid', $request->input('vehicle_uuid'));
        }

        if ($request->has('order_uuid')) {
            $query->where('order_uuid', $request->input('order_uuid'));
        }

        $limit = min(100, max(1, (int) ($request->input('limit', 50))));
        $positions = $query->latest('created_at')->limit($limit)->get();

        return response()->json([
            'data'      => $positions,
            'positions' => $positions,
        ]);
    }
}
