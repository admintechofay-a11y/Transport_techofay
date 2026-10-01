<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\DeliveryChallan;
use App\Services\ChallanAndGatePassService;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryChallanController extends FleetOpsController
{
    public $resource = 'delivery-challan';

    protected ChallanAndGatePassService $challanService;

    public function __construct(ChallanAndGatePassService $challanService)
    {
        $this->challanService = $challanService;
    }

    /**
     * Resolve delivery challan by ID, UUID, or Challan Number.
     */
    protected function resolveChallan(string $id): ?DeliveryChallan
    {
        $companyUuid = session('company', request()->header('Company-Header'));

        return DeliveryChallan::where(function ($query) use ($id) {
            $query->where('uuid', $id)
                ->orWhere('public_id', $id)
                ->orWhere('challan_number', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * List Delivery Challans.
     */
    public function index(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->header('Company-Header'));
        $query = DeliveryChallan::with(['order', 'vehicle', 'driver', 'consignee']);

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        if ($request->has('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('challan_number', 'like', "%{$term}%")
                    ->orWhere('received_by', 'like', "%{$term}%");
            });
        }

        $limit = (int) $request->input('limit', 15);
        $paginated = $query->latest()->paginate($limit);

        return response()->json($paginated);
    }

    /**
     * Store Delivery Challan.
     */
    public function store(Request $request): JsonResponse
    {
        $userUuid = $request->user()?->uuid;
        $companyUuid = session('company', $request->header('Company-Header'));

        $challan = $this->challanService->createDeliveryChallan($request->all(), $userUuid, $companyUuid);

        return response()->json([
            'challan' => $challan->load(['order', 'vehicle', 'driver', 'consignee']),
            'message' => 'Delivery challan issued successfully.',
        ], 201);
    }

    /**
     * Show Delivery Challan.
     */
    public function show(string $id): JsonResponse
    {
        $challan = $this->resolveChallan($id);
        if (!$challan) {
            return response()->json(['message' => 'Delivery challan not found.'], 404);
        }

        return response()->json([
            'challan' => $challan->load(['order', 'vehicle', 'driver', 'consignee']),
        ]);
    }

    /**
     * Update Delivery Challan.
     */
    public function update(string $id, Request $request): JsonResponse
    {
        $challan = $this->resolveChallan($id);
        if (!$challan) {
            return response()->json(['message' => 'Delivery challan not found.'], 404);
        }

        if ($request->has('status')) {
            $challan = $this->challanService->updateChallanStatus($challan, $request->input('status'), $request->all());
        } else {
            $challan->update($request->only([
                'received_by',
                'remarks',
                'material_items',
                'total_quantity',
                'total_weight',
            ]));
        }

        return response()->json([
            'challan' => $challan->load(['order', 'vehicle', 'driver', 'consignee']),
            'message' => 'Delivery challan updated.',
        ]);
    }

    /**
     * Update Status.
     */
    public function updateStatus(string $id, Request $request): JsonResponse
    {
        $challan = $this->resolveChallan($id);
        if (!$challan) {
            return response()->json(['message' => 'Delivery challan not found.'], 404);
        }

        $status = $request->input('status', 'delivered');
        $challan = $this->challanService->updateChallanStatus($challan, $status, $request->all());

        return response()->json([
            'challan' => $challan->load(['order', 'vehicle', 'driver', 'consignee']),
            'message' => "Delivery challan status updated to '{$status}'.",
        ]);
    }

    /**
     * Delete Delivery Challan.
     */
    public function destroy(string $id): JsonResponse
    {
        $challan = $this->resolveChallan($id);
        if (!$challan) {
            return response()->json(['message' => 'Delivery challan not found.'], 404);
        }

        $challan->delete();

        return response()->json(['message' => 'Delivery challan deleted successfully.']);
    }

    /**
     * Generate PDF stream for Delivery Challan.
     */
    public function generatePdf(string $id, \App\Services\PdfGenerationService $pdfService)
    {
        $challan = $this->resolveChallan($id);
        if (!$challan) {
            return response()->json(['message' => 'Delivery challan not found.'], 404);
        }

        $pdf = $pdfService->generateDeliveryChallan($challan);

        return $pdf->stream("{$challan->challan_number}.pdf");
    }
}
