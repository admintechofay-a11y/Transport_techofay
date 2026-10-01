<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\FreightCharge;
use App\Services\BillingEngineService;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Services\PdfGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FreightChargeController extends FleetOpsController
{
    public $resource = 'freight-charge';

    protected BillingEngineService $billingEngineService;

    public function __construct(BillingEngineService $billingEngineService)
    {
        $this->billingEngineService = $billingEngineService;
    }

    /**
     * Resolve FreightCharge by ID, UUID or Public ID.
     */
    protected function resolveFreightCharge(string $id): ?FreightCharge
    {
        $companyUuid = session('company', request()->header('Company-Header'));

        return FreightCharge::where(function ($query) use ($id) {
            $query->where('uuid', $id)->orWhere('public_id', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Calculate freight charges breakdown and GST dynamically.
     */
    public function calculate(Request $request): JsonResponse
    {
        $calculation = $this->billingEngineService->calculateCharges($request->all());

        return response()->json([
            'calculation' => $calculation,
        ]);
    }

    /**
     * Store / Create Freight Charge record using the BillingEngineService.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        $userUuid = $request->user()?->uuid;

        $charge = $this->billingEngineService->createOrUpdateFreightCharge($data, $userUuid);

        return response()->json([
            'freight_charge' => $charge,
            'message'        => 'Freight charge computed and saved successfully.',
        ], 201);
    }

    /**
     * Update existing Freight Charge record.
     */
    public function update(string $id, Request $request): JsonResponse
    {
        $data = $request->all();
        $data['uuid'] = $id;
        $userUuid = $request->user()?->uuid;

        $charge = $this->billingEngineService->createOrUpdateFreightCharge($data, $userUuid);

        return response()->json([
            'freight_charge' => $charge,
            'message'        => 'Freight charge updated successfully.',
        ]);
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
     * Index / Query Records.
     */
    public function index(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->header('Company-Header'));
        $query = FreightCharge::with(['order', 'customer']);

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        if ($request->has('payment_status') && $request->input('payment_status') !== 'all') {
            $query->where('payment_status', $request->input('payment_status'));
        }

        if ($request->has('customer_uuid')) {
            $query->where('customer_uuid', $request->input('customer_uuid'));
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'freight_charges' => $records,
            'data' => $records,
        ]);
    }

    /**
     * Show / Find Record.
     */
    public function show(string $id, Request $request): JsonResponse
    {
        $charge = $this->resolveFreightCharge($id);

        if (!$charge) {
            return response()->json(['error' => 'Freight charge record not found.'], 404);
        }

        $charge->loadMissing(['order', 'customer']);

        return response()->json([
            'freight_charge' => $charge,
            'data' => $charge,
        ]);
    }

    /**
     * Destroy / Delete Record.
     */
    public function destroy(string $id, Request $request): JsonResponse
    {
        $charge = $this->resolveFreightCharge($id);

        if (!$charge) {
            return response()->json(['error' => 'Freight charge record not found.'], 404);
        }

        $charge->delete();

        return response()->json(['message' => 'Freight charge deleted successfully.']);
    }

    /**
     * Record payment against a freight charge, updating status and balance.
     */
    public function recordPayment(string $id, Request $request): JsonResponse
    {
        $charge = $this->resolveFreightCharge($id);

        if (!$charge) {
            return response()->json(['error' => 'Freight charge record not found.'], 404);
        }

        $request->validate([
            'amount'         => 'required|numeric|min:0.01',
            'payment_method' => 'sometimes|nullable|string',
            'reference'      => 'sometimes|nullable|string',
            'notes'          => 'sometimes|nullable|string',
        ]);

        $amount = (float) $request->input('amount');
        $paymentMethod = $request->input('payment_method', 'Bank Transfer');
        $reference = $request->input('reference', '');
        $notes = $request->input('notes', '');

        // Update charge advance and balance
        $currentAdvance = (float) $charge->advance_paid;
        $currentBalance = (float) $charge->balance_payable;
        $newAdvance = round($currentAdvance + $amount, 2);
        $newBalance = max(0, round($currentBalance - $amount, 2));
        $newStatus = $newBalance <= 0 ? 'paid' : 'partial';

        $chargeUpdates = [
            'advance_paid'    => $newAdvance,
            'balance_payable' => $newBalance,
            'payment_status'  => $newStatus,
            'remarks'         => trim(($charge->remarks ? $charge->remarks . ' | ' : '') . "Payment of INR {$amount} via {$paymentMethod} Ref: {$reference} {$notes}"),
        ];

        \Illuminate\Support\Facades\DB::table('freight_charges')->where('uuid', $charge->uuid)->update($chargeUpdates);

        $refreshedCharge = FreightCharge::where('uuid', $charge->uuid)->with(['order', 'customer'])->first();

        return response()->json([
            'freight_charge' => $refreshedCharge,
            'message'        => 'Payment recorded successfully.',
        ]);
    }
}

