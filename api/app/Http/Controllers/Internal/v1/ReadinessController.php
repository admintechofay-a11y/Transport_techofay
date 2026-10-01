<?php

namespace App\Http\Controllers\Internal\v1;

use App\Services\ReadinessService;
use Fleetbase\Http\Controllers\FleetbaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReadinessController extends FleetbaseController
{
    protected ReadinessService $readinessService;

    public function __construct(ReadinessService $readinessService)
    {
        $this->readinessService = $readinessService;
        // Do not call parent constructor to avoid automatic model derivation
    }

    /**
     * Check system readiness across Database, Redis, and Queue.
     */
    public function check(Request $request): JsonResponse
    {
        $report = $this->readinessService->check();
        $statusCode = ($report['status'] === 'ready') ? 200 : 503;

        return response()->json($report, $statusCode);
    }
}
