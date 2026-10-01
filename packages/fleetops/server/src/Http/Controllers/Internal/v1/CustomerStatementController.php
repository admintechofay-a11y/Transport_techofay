<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\Bilty;
use Fleetbase\FleetOps\Models\Contact;
use Fleetbase\FleetOps\Models\FreightCharge;
use Fleetbase\FleetOps\Models\LrNumber;
use Fleetbase\FleetOps\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerStatementController extends FleetOpsController
{
    /**
     * Generate customer freight statement and ledger.
     */
    public function statement(string $customerUuid, Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);

        // Resolve Contact / Customer
        $customer = Contact::where(function ($query) use ($customerUuid) {
            $query->where('uuid', $customerUuid)->orWhere('public_id', $customerUuid);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();

        if (!$customer) {
            return response()->json(['error' => 'Customer / Contact not found.'], 404);
        }

        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        // Query Loads (Orders)
        $ordersQuery = Order::where(function ($q) use ($customer) {
            $q->where('customer_uuid', $customer->uuid)
                ->orWhere('facilitator_uuid', $customer->uuid);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->when($fromDate, fn ($q) => $q->whereDate('created_at', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->whereDate('created_at', '<=', $toDate))
            ->with(['payload', 'driverAssigned', 'vehicleAssigned']);

        $orders = $ordersQuery->orderBy('created_at', 'desc')->get();

        // Query LRs
        $lrsQuery = LrNumber::where(function ($q) use ($customer) {
            $q->where('customer_uuid', $customer->uuid)
                ->orWhere('consignor_uuid', $customer->uuid)
                ->orWhere('consignee_uuid', $customer->uuid);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->when($fromDate, fn ($q) => $q->whereDate('lr_date', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->whereDate('lr_date', '<=', $toDate))
            ->with(['vehicle', 'driver']);

        $lrs = $lrsQuery->orderBy('lr_date', 'desc')->get();

        // Query Bilties
        $biltiesQuery = Bilty::where(function ($q) use ($customer) {
            $q->where('customer_uuid', $customer->uuid)
                ->orWhere('consignor_uuid', $customer->uuid)
                ->orWhere('consignee_uuid', $customer->uuid);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->when($fromDate, fn ($q) => $q->whereDate('bilty_date', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->whereDate('bilty_date', '<=', $toDate))
            ->with(['vehicle', 'driver']);

        $bilties = $biltiesQuery->orderBy('bilty_date', 'desc')->get();

        // Query Freight Charges
        $chargesQuery = FreightCharge::where('customer_uuid', $customer->uuid)
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->when($fromDate, fn ($q) => $q->whereDate('created_at', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->whereDate('created_at', '<=', $toDate))
            ->with(['order']);

        $charges = $chargesQuery->orderBy('created_at', 'desc')->get();

        // Aggregations
        $totalFreightBilled = (float) $charges->sum('total_charges');
        $totalAdvancePaid   = (float) $charges->sum('advance_paid');
        $totalDeductions    = (float) $charges->sum('deductions');
        $outstandingBalance = (float) $charges->sum('balance_payable');

        // Compile unified transactions ledger
        $transactions = collect();

        foreach ($charges as $charge) {
            $transactions->push([
                'type'            => 'freight_charge',
                'id'              => $charge->public_id,
                'date'            => $charge->created_at->toDateString(),
                'load_number'     => $charge->order?->load_number ?: $charge->order?->public_id,
                'freight_amount'  => (float) $charge->freight_amount,
                'total_charges'   => (float) $charge->total_charges,
                'advance_paid'    => (float) $charge->advance_paid,
                'deductions'      => (float) $charge->deductions,
                'balance_payable' => (float) $charge->balance_payable,
                'payment_status'  => $charge->payment_status,
                'remarks'         => $charge->remarks,
            ]);
        }

        return response()->json([
            'customer' => [
                'uuid'             => $customer->uuid,
                'public_id'        => $customer->public_id,
                'name'             => $customer->name,
                'phone'            => $customer->phone,
                'email'            => $customer->email,
                'gstin'            => $customer->gstin,
                'pan_number'       => $customer->pan_number,
                'billing_address'  => $customer->billing_address,
                'delivery_address' => $customer->delivery_address,
                'payment_terms'    => $customer->payment_terms,
            ],
            'period' => [
                'from_date' => $fromDate,
                'to_date'   => $toDate,
            ],
            'summary' => [
                'total_loads'          => $orders->count(),
                'total_lrs'            => $lrs->count(),
                'total_bilties'        => $bilties->count(),
                'total_freight_billed' => $totalFreightBilled,
                'total_advance_paid'   => $totalAdvancePaid,
                'total_deductions'     => $totalDeductions,
                'outstanding_balance'  => $outstandingBalance,
            ],
            'transactions' => $transactions,
            'loads'        => $orders,
            'lrs'          => $lrs,
            'bilties'      => $bilties,
        ]);
    }
}
