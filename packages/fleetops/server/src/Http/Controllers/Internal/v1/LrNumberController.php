<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\LrNumber;
use Fleetbase\FleetOps\Models\LrStatusHistory;
use Fleetbase\FleetOps\Services\LrPdfService;
use Fleetbase\FleetOps\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LrNumberController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'lr-number';

    /**
     * Allowed status transitions.
     */
    protected array $allowedTransitions = [
        'draft'               => ['generated', 'cancelled'],
        'generated'           => ['loaded', 'cancelled'],
        'loaded'              => ['in_transit', 'cancelled'],
        'in_transit'          => ['partially_delivered', 'delivered', 'cancelled'],
        'partially_delivered' => ['delivered', 'cancelled'],
        'delivered'           => [],
        'cancelled'           => [],
    ];

    /**
     * Resolve LR by ID, UUID, Public ID or LR Number.
     */
    protected function resolveLrNumber(string $id): ?LrNumber
    {
        $companyUuid = session('company');

        return LrNumber::where(function ($query) use ($id) {
            $query->where('uuid', $id)
                ->orWhere('public_id', $id)
                ->orWhere('lr_number', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Update LR Status with validation and history logging.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $lr = $this->resolveLrNumber($id);

        if (!$lr) {
            return response()->json(['error' => 'LR Number not found.'], 404);
        }

        $validated = $request->validate([
            'status'   => 'required|string|in:draft,generated,loaded,in_transit,partially_delivered,delivered,cancelled',
            'notes'    => 'nullable|string|max:1000',
            'location' => 'nullable|string|max:500',
            'force'    => 'nullable|boolean',
        ]);

        $newStatus = $validated['status'];
        $currentStatus = $lr->status;
        $force = $request->boolean('force', false);

        if ($currentStatus === $newStatus) {
            return response()->json([
                'message' => 'LR is already in status ' . $newStatus,
                'data'    => $lr,
            ]);
        }

        // Validate status transition unless forced
        if (!$force && isset($this->allowedTransitions[$currentStatus])) {
            $allowed = $this->allowedTransitions[$currentStatus];
            if (!in_array($newStatus, $allowed, true)) {
                return response()->json([
                    'error'   => "Invalid status transition from '{$currentStatus}' to '{$newStatus}'. Allowed: " . implode(', ', $allowed),
                    'current' => $currentStatus,
                    'allowed' => $allowed,
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $userUuid = $request->user()?->uuid;

            // Log status history
            LrStatusHistory::create([
                'company_uuid'    => $lr->company_uuid,
                'lr_uuid'         => $lr->uuid,
                'status'          => $newStatus,
                'notes'           => $validated['notes'] ?? null,
                'location'        => $validated['location'] ?? null,
                'created_by_uuid' => $userUuid,
            ]);

            // Update status on LR
            $lr->status = $newStatus;
            $lr->updated_by_uuid = $userUuid;
            $lr->save();

            DB::commit();

            return response()->json([
                'message' => "LR status updated to {$newStatus}.",
                'data'    => $lr->fresh(['statusHistories', 'order', 'vehicle', 'driver', 'customer']),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Failed to update LR status: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate PDF stream for LR.
     */
    public function generatePdf(string $id)
    {
        $lr = $this->resolveLrNumber($id);

        if (!$lr) {
            return response()->json(['error' => 'LR Number not found.'], 404);
        }

        $lr->loadMissing(['order', 'vehicle', 'driver', 'customer', 'consignor', 'consignee', 'bilty']);

        $pdf = LrPdfService::generate($lr);

        return $pdf->stream("{$lr->lr_number}.pdf");
    }

    /**
     * Share LR PDF via WhatsApp.
     */
    public function shareWhatsApp(Request $request, string $id, WhatsAppService $whatsAppService): JsonResponse
    {
        $lr = $this->resolveLrNumber($id);

        if (!$lr) {
            return response()->json(['error' => 'LR Number not found.'], 404);
        }

        $lr->loadMissing(['order', 'vehicle', 'driver', 'customer', 'consignor', 'consignee']);

        try {
            $toPhone = $request->input('phone');
            $res = $whatsAppService->sendLrPdf($lr, $toPhone);

            return response()->json([
                'success' => true,
                'message' => 'LR PDF dispatched via WhatsApp.',
                'result'  => $res,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error'   => 'Failed to send WhatsApp: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get LR Status History.
     */
    public function history(string $id): JsonResponse
    {
        $lr = $this->resolveLrNumber($id);

        if (!$lr) {
            return response()->json(['error' => 'LR Number not found.'], 404);
        }

        $history = LrStatusHistory::where('lr_uuid', $lr->uuid)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'lr_number' => $lr->lr_number,
            'history'   => $history,
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
