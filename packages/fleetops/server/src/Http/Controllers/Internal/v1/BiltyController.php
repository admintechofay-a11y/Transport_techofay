<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\Bilty;
use Fleetbase\FleetOps\Services\PdfGenerationService;
use Fleetbase\FleetOps\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BiltyController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'bilty';

    /**
     * Resolve Bilty by ID, UUID, Public ID or Bilty Number.
     */
    protected function resolveBilty(string $id): ?Bilty
    {
        $companyUuid = session('company');

        return Bilty::where(function ($query) use ($id) {
            $query->where('uuid', $id)
                ->orWhere('public_id', $id)
                ->orWhere('bilty_number', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Generate PDF stream for Bilty.
     */
    public function generatePdf(string $id, PdfGenerationService $pdfService)
    {
        $bilty = $this->resolveBilty($id);

        if (!$bilty) {
            return response()->json(['error' => 'Bilty not found.'], 404);
        }

        $bilty->loadMissing(['order', 'vehicle', 'driver', 'customer', 'consignor', 'consignee', 'lrNumber']);

        $pdf = $pdfService->generateBilty($bilty);

        return $pdf->stream("{$bilty->bilty_number}.pdf");
    }

    /**
     * Share Bilty PDF via WhatsApp.
     */
    public function shareWhatsApp(Request $request, string $id, WhatsAppService $whatsAppService): JsonResponse
    {
        $bilty = $this->resolveBilty($id);

        if (!$bilty) {
            return response()->json(['error' => 'Bilty not found.'], 404);
        }

        $bilty->loadMissing(['order', 'vehicle', 'driver', 'customer', 'consignor', 'consignee']);

        try {
            $toPhone = $request->input('phone');
            $res = $whatsAppService->sendBiltyPdf($bilty, $toPhone);

            return response()->json([
                'success' => true,
                'message' => 'Bilty PDF dispatched via WhatsApp.',
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
