<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\FreightCharge;
use Fleetbase\FleetOps\Services\PdfGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FreightChargeController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'freight-charge';

    /**
     * Resolve FreightCharge by ID, UUID or Public ID.
     */
    protected function resolveFreightCharge(string $id): ?FreightCharge
    {
        $companyUuid = session('company');

        return FreightCharge::where(function ($query) use ($id) {
            $query->where('uuid', $id)->orWhere('public_id', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Generate freight statement PDF.
     */
    public function generateFreightStatement(string $id, PdfGenerationService $pdfService)
    {
        $charge = $this->resolveFreightCharge($id);

        if (!$charge) {
            return response()->json(['error' => 'Freight charge record not found.'], 404);
        }

        $charge->loadMissing(['order', 'customer']);

        $pdf = $pdfService->generateFreightStatement($charge);

        return $pdf->stream("freight-statement-{$charge->public_id}.pdf");
    }

    /**
     * Generate freight invoice PDF.
     */
    public function invoicePdf(string $id, PdfGenerationService $pdfService)
    {
        $charge = $this->resolveFreightCharge($id);

        if (!$charge) {
            return response()->json(['error' => 'Freight charge record not found.'], 404);
        }

        $charge->loadMissing(['order', 'customer']);

        $pdf = $pdfService->generateInvoice($charge);

        return $pdf->stream("invoice-{$charge->public_id}.pdf");
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
