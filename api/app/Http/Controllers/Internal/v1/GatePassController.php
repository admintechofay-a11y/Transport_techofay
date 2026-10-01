<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\GatePass;
use App\Services\ChallanAndGatePassService;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GatePassController extends FleetOpsController
{
    public $resource = 'gate-pass';

    protected ChallanAndGatePassService $challanService;

    public function __construct(ChallanAndGatePassService $challanService)
    {
        $this->challanService = $challanService;
    }

    /**
     * Resolve gate pass by ID, UUID, or Gate Pass Number.
     */
    protected function resolveGatePass(string $id): ?GatePass
    {
        $companyUuid = session('company', request()->header('Company-Header'));

        return GatePass::where(function ($query) use ($id) {
            $query->where('uuid', $id)
                ->orWhere('public_id', $id)
                ->orWhere('gate_pass_number', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * List Gate Passes.
     */
    public function index(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->header('Company-Header'));
        $query = GatePass::with(['order', 'vehicle', 'driver']);

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        if ($request->has('pass_type') && $request->input('pass_type') !== 'all') {
            $query->where('pass_type', $request->input('pass_type'));
        }

        if ($request->has('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('gate_pass_number', 'like', "%{$term}%")
                    ->orWhere('security_name', 'like', "%{$term}%")
                    ->orWhere('authorized_by', 'like', "%{$term}%");
            });
        }

        $limit = (int) $request->input('limit', 15);
        $paginated = $query->latest()->paginate($limit);

        return response()->json($paginated);
    }

    /**
     * Store Gate Pass.
     */
    public function store(Request $request): JsonResponse
    {
        $userUuid = $request->user()?->uuid;
        $companyUuid = session('company', $request->header('Company-Header'));

        $gatePass = $this->challanService->createGatePass($request->all(), $userUuid, $companyUuid);

        return response()->json([
            'gate_pass' => $gatePass->load(['order', 'vehicle', 'driver']),
            'message'   => 'Gate pass issued successfully with HMAC signed QR token.',
        ], 201);
    }

    /**
     * Show Gate Pass.
     */
    public function show(string $id): JsonResponse
    {
        $gatePass = $this->resolveGatePass($id);
        if (!$gatePass) {
            return response()->json(['message' => 'Gate pass not found.'], 404);
        }

        return response()->json([
            'gate_pass' => $gatePass->load(['order', 'vehicle', 'driver']),
        ]);
    }

    /**
     * Record Exit for Gate Pass.
     */
    public function recordExit(string $id, Request $request): JsonResponse
    {
        $gatePass = $this->resolveGatePass($id);
        if (!$gatePass) {
            return response()->json(['message' => 'Gate pass not found.'], 404);
        }

        $gatePass = $this->challanService->recordGatePassExit($gatePass);

        return response()->json([
            'gate_pass' => $gatePass->load(['order', 'vehicle', 'driver']),
            'message'   => 'Exit timestamp recorded successfully.',
        ]);
    }

    /**
     * Verify HMAC-signed QR token for security checkpost.
     */
    public function verifyQrToken(Request $request): JsonResponse
    {
        $token = $request->input('qr_token') ?: $request->input('token');
        if (!$token) {
            return response()->json(['message' => 'Missing QR token.'], 422);
        }

        $verifiedData = $this->challanService->verifyHmacSignedQrToken($token);
        if (!$verifiedData) {
            return response()->json(['message' => 'Invalid or tampered QR token.'], 403);
        }

        $gatePass = GatePass::where('uuid', $verifiedData['uuid'] ?? null)->first();
        if (!$gatePass) {
            return response()->json(['message' => 'Gate pass record not found in database.'], 404);
        }

        return response()->json([
            'valid'     => true,
            'gate_pass' => $gatePass->load(['order', 'vehicle', 'driver']),
            'token_data'=> $verifiedData,
        ]);
    }

    /**
     * Delete Gate Pass.
     */
    public function destroy(string $id): JsonResponse
    {
        $gatePass = $this->resolveGatePass($id);
        if (!$gatePass) {
            return response()->json(['message' => 'Gate pass not found.'], 404);
        }

        $gatePass->delete();

        return response()->json(['message' => 'Gate pass deleted successfully.']);
    }

    /**
     * Generate PDF stream for Gate Pass.
     */
    public function generatePdf(string $id, \App\Services\PdfGenerationService $pdfService)
    {
        $gatePass = $this->resolveGatePass($id);
        if (!$gatePass) {
            return response()->json(['message' => 'Gate pass not found.'], 404);
        }

        $gatePass->loadMissing(['order', 'vehicle', 'driver']);
        $pdf = $pdfService->generateGatePass($gatePass);

        return $pdf->stream("{$gatePass->gate_pass_number}.pdf");
    }
}
