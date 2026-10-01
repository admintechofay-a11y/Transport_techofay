<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\Bilty;
use App\Services\BiltyDomainService;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Services\PdfGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BiltyController extends FleetOpsController
{
    public $resource = 'bilty';

    protected BiltyDomainService $biltyDomainService;

    public function __construct(BiltyDomainService $biltyDomainService)
    {
        $this->biltyDomainService = $biltyDomainService;
    }

    /**
     * Resolve Bilty by ID, UUID, Public ID or Bilty Number.
     */
    protected function resolveBilty(string $id): ?Bilty
    {
        $companyUuid = session('company', request()->header('Company-Header'));

        return Bilty::where(function ($query) use ($id) {
            $query->where('uuid', $id)
                ->orWhere('public_id', $id)
                ->orWhere('bilty_number', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Create / Store Bilty using atomic BiltyDomainService.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        $userUuid = $request->user()?->uuid;

        $bilty = $this->biltyDomainService->createBilty($data, $userUuid);

        return response()->json([
            'bilty'   => $bilty,
            'message' => 'Bilty created successfully with atomic number allocation.',
        ], 201);
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
     * Index / List Bilties.
     */
    public function index(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->header('Company-Header'));
        $query = Bilty::with(['order', 'vehicle', 'driver', 'customer', 'consignor', 'consignee', 'lrNumber']);

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        if ($request->has('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('bilty_number', 'like', "%{$term}%")
                    ->orWhere('payment_terms', 'like', "%{$term}%");
            });
        }

        $limit = (int) $request->input('limit', 15);
        $paginated = $query->latest()->paginate($limit);

        return response()->json($paginated);
    }

    /**
     * Show / Find Bilty.
     */
    public function show(string $id): JsonResponse
    {
        $bilty = $this->resolveBilty($id);

        if (!$bilty) {
            return response()->json(['error' => 'Bilty not found.'], 404);
        }

        return response()->json([
            'bilty' => $bilty->load(['order', 'vehicle', 'driver', 'customer', 'consignor', 'consignee', 'lrNumber']),
        ]);
    }

    /**
     * Update Bilty.
     */
    public function update(string $id, Request $request): JsonResponse
    {
        $bilty = $this->resolveBilty($id);

        if (!$bilty) {
            return response()->json(['error' => 'Bilty not found.'], 404);
        }

        $bilty->update($request->only([
            'payment_terms',
            'freight_amount',
            'advance_paid',
            'balance_due',
            'delivery_address',
            'notes',
        ]));

        return response()->json([
            'bilty'   => $bilty->load(['order', 'vehicle', 'driver', 'customer', 'consignor', 'consignee', 'lrNumber']),
            'message' => 'Bilty updated successfully.',
        ]);
    }

    /**
     * Destroy / Delete Bilty.
     */
    public function destroy(string $id): JsonResponse
    {
        $bilty = $this->resolveBilty($id);

        if (!$bilty) {
            return response()->json(['error' => 'Bilty not found.'], 404);
        }

        $bilty->delete();

        return response()->json(['message' => 'Bilty deleted successfully.']);
    }
}
