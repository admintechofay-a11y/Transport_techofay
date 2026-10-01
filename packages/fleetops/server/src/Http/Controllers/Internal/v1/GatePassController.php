<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\GatePass;
use Fleetbase\FleetOps\Services\PdfGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GatePassController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'gate-pass';

    /**
     * Resolve GatePass by ID, UUID, Public ID or Gate Pass Number.
     */
    protected function resolveGatePass(string $id): ?GatePass
    {
        $companyUuid = session('company');

        return GatePass::where(function ($query) use ($id) {
            $query->where('uuid', $id)
                ->orWhere('public_id', $id)
                ->orWhere('gate_pass_number', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Generate PDF stream for Gate Pass.
     */
    public function generatePdf(string $id, PdfGenerationService $pdfService)
    {
        $gatePass = $this->resolveGatePass($id);

        if (!$gatePass) {
            return response()->json(['error' => 'Gate pass not found.'], 404);
        }

        $gatePass->loadMissing(['order', 'vehicle', 'driver']);

        $pdf = $pdfService->generateGatePass($gatePass);

        return $pdf->stream("{$gatePass->gate_pass_number}.pdf");
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
