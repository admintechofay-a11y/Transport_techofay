<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\Bilty;
use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\FreightCharge;
use Fleetbase\FleetOps\Models\LrNumber;
use Fleetbase\FleetOps\Models\Order;
use Fleetbase\FleetOps\Models\Vehicle;
use Fleetbase\FleetOps\Models\VehicleDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransportDashboardController extends FleetOpsController
{
    /**
     * Get operational transport dashboard metrics.
     */
    public function metrics(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $today = now()->toDateString();
        $thirtyDays = now()->addDays(30)->toDateString();

        return response()->json([
            // Loads
            'total_loads'          => Order::where('company_uuid', $companyUuid)->count(),
            'today_loads'          => Order::where('company_uuid', $companyUuid)->whereDate('created_at', $today)->count(),
            'pending_loads'        => Order::where('company_uuid', $companyUuid)->whereNotIn('status', ['delivered', 'closed', 'canceled', 'cancelled'])->count(),
            'completed_loads'      => Order::where('company_uuid', $companyUuid)->whereIn('status', ['delivered', 'closed'])->count(),

            // Vehicles
            'vehicles_available'   => Vehicle::where('company_uuid', $companyUuid)->where('status', 'available')->count(),
            'vehicles_on_trip'     => Vehicle::where('company_uuid', $companyUuid)->where('status', 'on_trip')->count(),
            'vehicles_maintenance' => Vehicle::where('company_uuid', $companyUuid)->where('status', 'under_maintenance')->count(),
            'vehicles_inactive'    => Vehicle::where('company_uuid', $companyUuid)->whereIn('status', ['inactive', 'out_of_service'])->count(),

            // Drivers
            'drivers_available'    => Driver::where('company_uuid', $companyUuid)->where('status', 'available')->count(),
            'drivers_on_trip'      => Driver::where('company_uuid', $companyUuid)->where('status', 'on_trip')->count(),

            // LR / Bilty
            'pending_lrs'          => LrNumber::where('company_uuid', $companyUuid)->whereNotIn('status', ['delivered', 'cancelled'])->count(),
            'pending_bilties'      => Bilty::where('company_uuid', $companyUuid)->whereNotIn('status', ['delivered', 'cancelled'])->count(),

            // POD
            'pending_pods'         => Order::where('company_uuid', $companyUuid)
                ->where('pod_required', true)
                ->whereDoesntHave('proof')
                ->whereIn('status', ['delivered', 'partially_delivered'])
                ->count(),

            // Freight
            'total_freight_today'  => (float) FreightCharge::where('company_uuid', $companyUuid)->whereDate('created_at', $today)->sum('freight_amount'),
            'total_advance_today'  => (float) FreightCharge::where('company_uuid', $companyUuid)->whereDate('created_at', $today)->sum('advance_paid'),
            'outstanding_balance'  => (float) FreightCharge::where('company_uuid', $companyUuid)->where('payment_status', '!=', 'paid')->sum('balance_payable'),

            // Expiry Alerts (next 30 days)
            'expiring_documents'   => VehicleDocument::where('company_uuid', $companyUuid)
                ->whereBetween('expiry_date', [$today, $thirtyDays])
                ->where('is_active', true)
                ->count(),
            'expiring_licences'    => Driver::where('company_uuid', $companyUuid)
                ->whereBetween('drivers_license_expiry', [$today, $thirtyDays])
                ->count(),
        ]);
    }
}
