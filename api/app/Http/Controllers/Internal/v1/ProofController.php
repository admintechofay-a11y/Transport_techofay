<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\Proof;
use App\Services\PdfGenerationService;
use App\Services\ProofOfDeliveryService;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProofController extends FleetOpsController
{
    public $resource = 'proof';

    public $service;

    public function __construct(ProofOfDeliveryService $service)
    {
        $this->service = $service;
    }

    /**
     * Resolve Proof by ID or UUID.
     */
    protected function resolveProof(string $id): ?Proof
    {
        $companyUuid = session('company', request()->header('Company-Header'));

        return Proof::where(function ($query) use ($id) {
            $query->where('uuid', $id)
                ->orWhere('public_id', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * List Proofs.
     */
    public function index(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->header('Company-Header'));
        $limit = (int) $request->input('limit', 15);
        $paginated = $this->service->listProofs($request->all(), $companyUuid, $limit);

        return response()->json($paginated);
    }

    /**
     * Create / Submit Proof of Delivery.
     */
    public function store(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->header('Company-Header'));

        $request->validate([
            'order_uuid' => 'sometimes|nullable|string',
            'receiver_name' => 'sometimes|nullable|string',
        ]);

        $proof = $this->service->createPod($request->all(), $companyUuid);

        return response()->json([
            'proof'   => $proof->load('order'),
            'message' => 'Proof of delivery submitted successfully.',
        ], 201);
    }

    /**
     * Show Proof.
     */
    public function show(string $id): JsonResponse
    {
        $proof = $this->resolveProof($id);
        if (!$proof) {
            return response()->json(['message' => 'Proof record not found.'], 404);
        }

        return response()->json([
            'proof' => $proof->load('order'),
        ]);
    }

    /**
     * Generate PDF stream for POD.
     */
    public function generatePdf(string $id, PdfGenerationService $pdfService)
    {
        $proof = $this->resolveProof($id);
        if (!$proof) {
            return response()->json(['message' => 'Proof record not found.'], 404);
        }

        $pdf = $pdfService->generatePod($proof);

        return $pdf->stream("pod-{$proof->public_id}.pdf");
    }
}
