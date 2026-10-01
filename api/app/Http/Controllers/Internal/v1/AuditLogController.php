<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\AuditLog;
use App\Scopes\CompanyScope;
use App\Services\AuditLogService;
use Fleetbase\Http\Controllers\FleetbaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends FleetbaseController
{
    protected AuditLogService $auditService;

    public function __construct(AuditLogService $auditService)
    {
        $this->auditService = $auditService;
        // Do not call parent::__construct() to prevent automatic setApiModel() invocation
    }

    /**
     * Query audit logs with multi-tenant company isolation.
     */
    public function index(Request $request): JsonResponse
    {
        $companyUuid = CompanyScope::resolveCompanyUuid()
            ?? session('company')
            ?? $request->header('X-Company-Uuid')
            ?? $request->input('company');

        if (!$companyUuid) {
            return response()->json([
                'errors' => ['Company context is required to query audit logs.']
            ], 403);
        }

        $filters = [
            'action'      => $request->input('action'),
            'entity_type' => $request->input('entity_type'),
            'entity_uuid' => $request->input('entity_uuid'),
            'user_uuid'   => $request->input('user_uuid'),
            'date_from'   => $request->input('date_from') ?? $request->input('startDate'),
            'date_to'     => $request->input('date_to') ?? $request->input('endDate'),
            'search'      => $request->input('search') ?? $request->input('query'),
        ];

        $perPage = (int) ($request->input('limit') ?? $request->input('per_page') ?? 20);
        $perPage = max(1, min(100, $perPage));

        $paginator = $this->auditService->queryLogs($companyUuid, $filters, $perPage);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
            'audit_logs' => $paginator->items(),
        ]);
    }

    /**
     * Get a single audit log entry with company isolation.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $companyUuid = CompanyScope::resolveCompanyUuid()
            ?? session('company')
            ?? $request->header('X-Company-Uuid')
            ?? $request->input('company');

        if (!$companyUuid) {
            return response()->json([
                'errors' => ['Company context is required.']
            ], 403);
        }

        $log = AuditLog::where('company_uuid', $companyUuid)
            ->where(function ($q) use ($id) {
                $q->where('uuid', $id)->orWhere('id', $id)->orWhere('public_id', $id);
            })
            ->first();

        if (!$log) {
            return response()->json([
                'error' => 'Audit log entry not found.'
            ], 404);
        }

        return response()->json([
            'audit_log' => $log,
            'data'      => $log,
        ]);
    }
}
