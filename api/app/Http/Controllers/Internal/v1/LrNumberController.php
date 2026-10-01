<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\LrNumber;
use App\Services\LrDomainService;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Services\PdfGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LrNumberController extends FleetOpsController
{
    public $resource = 'lr-number';

    protected LrDomainService $lrDomainService;

    public function __construct(LrDomainService $lrDomainService)
    {
        $this->lrDomainService = $lrDomainService;
    }

    /**
     * Resolve LR by ID, UUID, Public ID or LR Number.
     */
    protected function resolveLrNumber(string $id): ?LrNumber
    {
        $companyUuid = session('company', request()->header('Company-Header'));

        return LrNumber::where(function ($query) use ($id) {
            $query->where('uuid', $id)
                ->orWhere('public_id', $id)
                ->orWhere('lr_number', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * List LR Numbers.
     */
    public function index(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->header('Company-Header'));
        $query = LrNumber::with(['order', 'vehicle', 'driver', 'statusHistory']);

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        if ($request->has('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('lr_number', 'like', "%{$term}%")
                    ->orWhere('consignor_name', 'like', "%{$term}%")
                    ->orWhere('consignee_name', 'like', "%{$term}%");
            });
        }

        $limit = (int) $request->input('limit', 15);
        $paginated = $query->latest()->paginate($limit);

        return response()->json($paginated);
    }

    /**
     * Show single LR Number.
     */
    public function show(string $id): JsonResponse
    {
        $lr = $this->resolveLrNumber($id);

        if (!$lr) {
            return response()->json(['error' => 'LR Number not found.'], 404);
        }

        return response()->json([
            'lr_number' => $lr->load(['order', 'vehicle', 'driver', 'statusHistory']),
        ]);
    }

    /**
     * Create / Store LR using the atomic LrDomainService.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        $userUuid = $request->user()?->uuid;

        $lr = $this->lrDomainService->createLr($data, $userUuid);

        return response()->json([
            'lr_number' => $lr,
            'message'   => 'LR created successfully with atomic number allocation.',
        ], 201);
    }

    /**
     * Update LR Status with strict state machine validation and history logging.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $lr = $this->resolveLrNumber($id);

        if (!$lr) {
            return response()->json(['error' => 'LR Number not found.'], 404);
        }

        $request->validate([
            'status'  => 'required|string',
            'remarks' => 'nullable|string',
            'notes'   => 'nullable|string',
        ]);

        $newStatus = $request->input('status');
        $remarks = $request->input('remarks') ?: $request->input('notes');
        $userUuid = $request->user()?->uuid;

        $updatedLr = $this->lrDomainService->transitionStatus($lr, $newStatus, $remarks, $userUuid);

        return response()->json([
            'lr_number' => $updatedLr,
            'message'   => "LR status transitioned to {$updatedLr->status}.",
        ]);
    }

    /**
     * Get status history for an LR.
     */
    public function history(string $id): JsonResponse
    {
        $lr = $this->resolveLrNumber($id);

        if (!$lr) {
            return response()->json(['error' => 'LR Number not found.'], 404);
        }

        $history = $this->lrDomainService->getHistory($lr);

        return response()->json([
            'lr_number' => $lr->lr_number,
            'history'   => $history,
        ]);
    }

    /**
     * Generate / Stream LR PDF.
     */
    public function generatePdf(string $id)
    {
        $lr = $this->resolveLrNumber($id);

        if (!$lr) {
            return response()->json(['error' => 'LR Number not found.'], 404);
        }

        $pdfService = app(PdfGenerationService::class);
        $pdf = $pdfService->generateLr($lr);

        return $pdf->stream("{$lr->lr_number}.pdf");
    }
}
