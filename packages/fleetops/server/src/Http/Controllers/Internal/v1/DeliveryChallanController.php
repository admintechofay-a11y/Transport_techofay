<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\DeliveryChallan;
use Fleetbase\FleetOps\Services\PdfGenerationService;
use Fleetbase\FleetOps\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryChallanController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'delivery-challan';

    /**
     * Resolve DeliveryChallan by ID, UUID, Public ID or Challan Number.
     */
    protected function resolveChallan(string $id): ?DeliveryChallan
    {
        $companyUuid = session('company');

        return DeliveryChallan::where(function ($query) use ($id) {
            $query->where('uuid', $id)
                ->orWhere('public_id', $id)
                ->orWhere('challan_number', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Generate PDF stream for Delivery Challan.
     */
    public function generatePdf(string $id, PdfGenerationService $pdfService)
    {
        $challan = $this->resolveChallan($id);

        if (!$challan) {
            return response()->json(['error' => 'Delivery challan not found.'], 404);
        }

        $challan->loadMissing(['order', 'vehicle', 'driver', 'consignee', 'loadLocation']);

        $pdf = $pdfService->generateDeliveryChallan($challan);

        return $pdf->stream("{$challan->challan_number}.pdf");
    }

    /**
     * Share Delivery Challan PDF via WhatsApp.
     */
    public function shareWhatsApp(Request $request, string $id, WhatsAppService $whatsAppService): JsonResponse
    {
        $challan = $this->resolveChallan($id);

        if (!$challan) {
            return response()->json(['error' => 'Delivery challan not found.'], 404);
        }

        $challan->loadMissing(['order', 'vehicle', 'driver', 'consignee']);

        try {
            $toPhone = $request->input('phone');
            $res = $whatsAppService->sendDeliveryChallanPdf($challan, $toPhone);

            return response()->json([
                'success' => true,
                'message' => 'Delivery Challan PDF dispatched via WhatsApp.',
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
