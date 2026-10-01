<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\Bilty;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Models\FreightCharge;
use App\Models\LrNumber;
use App\Models\Order;
use App\Models\Proof;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TransportDashboardController extends FleetOpsController
{
    public function __construct()
    {
        // Do not call parent constructor to avoid automatic model derivation
    }
    public function metrics(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->header('Company-Header'));

        $ordersQuery = Order::query()->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid));
        $totalLoads = (clone $ordersQuery)->count();
        $todayLoads = (clone $ordersQuery)->whereDate('created_at', Carbon::today())->count();
        $pendingLoads = (clone $ordersQuery)->whereNotIn('status', ['completed', 'canceled', 'declined'])->count();
        $completedLoads = (clone $ordersQuery)->where('status', 'completed')->count();

        $vehiclesQuery = Vehicle::query()->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid));
        $vehiclesAvailable = (clone $vehiclesQuery)->where('status', 'available')->count();
        $vehiclesOnTrip = (clone $vehiclesQuery)->whereIn('status', ['active', 'in_transit', 'on_trip'])->count();
        $vehiclesMaintenance = (clone $vehiclesQuery)->where('status', 'maintenance')->count();
        $vehiclesInactive = (clone $vehiclesQuery)->whereIn('status', ['inactive', 'decommissioned'])->count();

        $driversQuery = Driver::query()->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid));
        $driversAvailable = (clone $driversQuery)->where('status', 'available')->count();
        $driversOnTrip = (clone $driversQuery)->whereIn('status', ['active', 'in_transit', 'on_trip'])->count();

        $pendingLrs = LrNumber::query()->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))->whereIn('status', ['draft', 'assigned'])->count();
        $pendingBilties = Bilty::query()->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))->whereIn('status', ['draft', 'issued'])->count();
        $pendingPods = Proof::query()->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))->where('status', 'pending')->count();

        $freightQuery = FreightCharge::query()->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid));
        $totalFreightToday = (float) (clone $freightQuery)->whereDate('created_at', Carbon::today())->sum('freight_amount');
        $totalAdvanceToday = (float) (clone $freightQuery)->whereDate('created_at', Carbon::today())->sum('advance_amount');
        $outstandingBalance = (float) (clone $freightQuery)->where('payment_status', '!=', 'paid')->sum('balance_amount');

        $now = Carbon::now();
        $threshold = Carbon::now()->addDays(30);

        $expiringDocs = VehicleDocument::query()
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [$now, $threshold])
            ->count();

        $expiringLicences = DriverDocument::query()
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [$now, $threshold])
            ->count();

        return response()->json([
            'total_loads' => $totalLoads,
            'today_loads' => $todayLoads,
            'pending_loads' => $pendingLoads,
            'completed_loads' => $completedLoads,

            'vehicles_available' => $vehiclesAvailable,
            'vehicles_on_trip' => $vehiclesOnTrip,
            'vehicles_maintenance' => $vehiclesMaintenance,
            'vehicles_inactive' => $vehiclesInactive,

            'drivers_available' => $driversAvailable,
            'drivers_on_trip' => $driversOnTrip,

            'pending_lrs' => $pendingLrs,
            'pending_bilties' => $pendingBilties,
            'pending_pods' => $pendingPods,

            'total_freight_today' => $totalFreightToday,
            'total_advance_today' => $totalAdvanceToday,
            'outstanding_balance' => $outstandingBalance,

            'expiring_documents' => $expiringDocs,
            'expiring_licences' => $expiringLicences,
        ]);
    }
}
