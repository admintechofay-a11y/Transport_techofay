<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Barryvdh\DomPDF\Facade\Pdf;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\Bilty;
use Fleetbase\FleetOps\Models\Contact;
use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\DriverDocument;
use Fleetbase\FleetOps\Models\FreightCharge;
use Fleetbase\FleetOps\Models\LrNumber;
use Fleetbase\FleetOps\Models\Order;
use Fleetbase\FleetOps\Models\Vehicle;
use Fleetbase\FleetOps\Models\VehicleDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransportReportController extends FleetOpsController
{
    /**
     * Load Report: date/customer/status/vehicle/driver filter -> paginated list.
     */
    public function loadReport(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $limit = max(1, min((int) $request->input('limit', 25), 100));

        $query = Order::with(['customer', 'driverAssigned', 'vehicleAssigned', 'payload'])
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->when($request->input('start_date'), fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->input('end_date'), fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($request->input('customer_uuid'), fn ($q, $v) => $q->where('customer_uuid', $v))
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->input('vehicle_uuid'), fn ($q, $v) => $q->where('vehicle_assigned_uuid', $v))
            ->when($request->input('driver_uuid'), fn ($q, $v) => $q->where('driver_assigned_uuid', $v))
            ->orderBy('created_at', 'desc');

        return response()->json($query->paginate($limit));
    }

    /**
     * LR-wise report with status history.
     */
    public function lrReport(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $limit = max(1, min((int) $request->input('limit', 25), 100));

        $query = LrNumber::with(['order', 'vehicle', 'driver', 'customer', 'statusHistories'])
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->when($request->input('start_date'), fn ($q, $v) => $q->whereDate('lr_date', '>=', $v))
            ->when($request->input('end_date'), fn ($q, $v) => $q->whereDate('lr_date', '<=', $v))
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->input('customer_uuid'), fn ($q, $v) => $q->where('customer_uuid', $v))
            ->orderBy('lr_date', 'desc');

        return response()->json($query->paginate($limit));
    }

    /**
     * Bilty-wise report.
     */
    public function biltyReport(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $limit = max(1, min((int) $request->input('limit', 25), 100));

        $query = Bilty::with(['order', 'vehicle', 'driver', 'customer', 'consignor', 'consignee', 'lrNumber'])
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->when($request->input('start_date'), fn ($q, $v) => $q->whereDate('bilty_date', '>=', $v))
            ->when($request->input('end_date'), fn ($q, $v) => $q->whereDate('bilty_date', '<=', $v))
            ->when($request->input('payment_terms'), fn ($q, $v) => $q->where('payment_terms', $v))
            ->orderBy('bilty_date', 'desc');

        return response()->json($query->paginate($limit));
    }

    /**
     * Vehicle utilization report: trips/status per vehicle in date range.
     */
    public function vehicleUtilizationReport(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $startDate = $request->input('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $vehicles = Vehicle::when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->withCount([
                'orders as total_trips' => function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('created_at', [$startDate, $endDate]);
                },
                'orders as completed_trips' => function ($q) use ($startDate, $endDate) {
                    $q->whereIn('status', ['delivered', 'closed'])->whereBetween('created_at', [$startDate, $endDate]);
                },
            ])
            ->get()
            ->map(function ($vehicle) {
                return [
                    'vehicle_uuid'     => $vehicle->uuid,
                    'public_id'        => $vehicle->public_id,
                    'plate_number'     => $vehicle->plate_number,
                    'name'             => $vehicle->name,
                    'category'         => $vehicle->vehicle_category,
                    'capacity_tonnes'  => $vehicle->capacity_tonnes,
                    'status'           => $vehicle->status,
                    'total_trips'      => $vehicle->total_trips,
                    'completed_trips'  => $vehicle->completed_trips,
                    'active_trips'     => $vehicle->total_trips - $vehicle->completed_trips,
                ];
            });

        return response()->json([
            'period'   => ['start_date' => $startDate, 'end_date' => $endDate],
            'vehicles' => $vehicles,
        ]);
    }

    /**
     * Driver trip report: trips per driver.
     */
    public function driverTripReport(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $startDate = $request->input('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $drivers = Driver::when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->withCount([
                'orders as total_trips' => function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('created_at', [$startDate, $endDate]);
                },
                'orders as completed_trips' => function ($q) use ($startDate, $endDate) {
                    $q->whereIn('status', ['delivered', 'closed'])->whereBetween('created_at', [$startDate, $endDate]);
                },
            ])
            ->get()
            ->map(function ($driver) {
                return [
                    'driver_uuid'     => $driver->uuid,
                    'public_id'       => $driver->public_id,
                    'name'            => $driver->name,
                    'phone'           => $driver->phone,
                    'status'          => $driver->status,
                    'total_trips'     => $driver->total_trips,
                    'completed_trips' => $driver->completed_trips,
                    'active_trips'    => $driver->total_trips - $driver->completed_trips,
                ];
            });

        return response()->json([
            'period'  => ['start_date' => $startDate, 'end_date' => $endDate],
            'drivers' => $drivers,
        ]);
    }

    /**
     * Freight report: freight/advance/balance per date/customer.
     */
    public function freightReport(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $limit = max(1, min((int) $request->input('limit', 25), 100));

        $query = FreightCharge::with(['customer', 'order'])
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->when($request->input('start_date'), fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->input('end_date'), fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($request->input('customer_uuid'), fn ($q, $v) => $q->where('customer_uuid', $v))
            ->when($request->input('payment_status'), fn ($q, $v) => $q->where('payment_status', $v))
            ->orderBy('created_at', 'desc');

        $totals = [
            'total_freight'   => (float) (clone $query)->sum('freight_amount'),
            'total_charges'   => (float) (clone $query)->sum('total_charges'),
            'total_advance'   => (float) (clone $query)->sum('advance_paid'),
            'total_deductions'=> (float) (clone $query)->sum('deductions'),
            'total_balance'   => (float) (clone $query)->sum('balance_payable'),
        ];

        return response()->json([
            'totals'  => $totals,
            'records' => $query->paginate($limit),
        ]);
    }

    /**
     * Delivery and POD compliance report.
     */
    public function deliveryPodReport(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $limit = max(1, min((int) $request->input('limit', 25), 100));

        $query = Order::with(['customer', 'driverAssigned', 'vehicleAssigned', 'proofs'])
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->whereIn('status', ['delivered', 'partially_delivered', 'closed'])
            ->when($request->input('start_date'), fn ($q, $v) => $q->whereDate('updated_at', '>=', $v))
            ->when($request->input('end_date'), fn ($q, $v) => $q->whereDate('updated_at', '<=', $v))
            ->when($request->input('has_pod') === 'true', fn ($q) => $q->whereHas('proofs'))
            ->when($request->input('has_pod') === 'false', fn ($q) => $q->whereDoesntHave('proofs'))
            ->orderBy('updated_at', 'desc');

        $paginated = $query->paginate($limit);
        $paginated->getCollection()->transform(function ($order) {
            $order->has_pod = $order->proofs->isNotEmpty();
            return $order;
        });

        return response()->json($paginated);
    }

    /**
     * Outstanding freight report grouped by customer.
     */
    public function outstandingReport(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);

        $charges = FreightCharge::with(['customer'])
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->where('payment_status', '!=', 'paid')
            ->get();

        $grouped = $charges->groupBy('customer_uuid')->map(function ($customerCharges) {
            $customer = $customerCharges->first()?->customer;
            return [
                'customer_uuid'        => $customer?->uuid,
                'customer_name'        => $customer?->name ?: 'Unknown',
                'customer_phone'       => $customer?->phone,
                'customer_gstin'       => $customer?->gstin,
                'unpaid_invoices_count'=> $customerCharges->count(),
                'total_freight'        => (float) $customerCharges->sum('freight_amount'),
                'total_advance_paid'   => (float) $customerCharges->sum('advance_paid'),
                'total_deductions'     => (float) $customerCharges->sum('deductions'),
                'total_outstanding'    => (float) $customerCharges->sum('balance_payable'),
            ];
        })->values()->sortByDesc('total_outstanding')->values();

        return response()->json([
            'grand_outstanding' => (float) $grouped->sum('total_outstanding'),
            'customers'         => $grouped,
        ]);
    }

    /**
     * Document expiry report for next X days.
     */
    public function documentExpiryReport(Request $request): JsonResponse
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $days = (int) $request->input('days', 30);
        $today = now()->toDateString();
        $targetDate = now()->addDays($days)->toDateString();

        $vehicleDocs = VehicleDocument::with(['vehicle'])
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->where('is_active', true)
            ->whereBetween('expiry_date', [$today, $targetDate])
            ->orderBy('expiry_date', 'asc')
            ->get();

        $driverDocs = DriverDocument::with(['driver'])
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->where('is_active', true)
            ->whereBetween('expiry_date', [$today, $targetDate])
            ->orderBy('expiry_date', 'asc')
            ->get();

        $driverLicences = Driver::when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->whereBetween('drivers_license_expiry', [$today, $targetDate])
            ->orderBy('drivers_license_expiry', 'asc')
            ->get();

        return response()->json([
            'days_threshold'         => $days,
            'vehicle_documents'      => $vehicleDocs,
            'driver_documents'       => $driverDocs,
            'driver_licenses'        => $driverLicences,
            'total_expiring_records' => $vehicleDocs->count() + $driverDocs->count() + $driverLicences->count(),
        ]);
    }

    /**
     * Export any report as CSV / Excel format.
     */
    public function exportExcel(Request $request, string $reportType): StreamedResponse
    {
        $fileName = "report-{$reportType}-" . now()->format('Ymd-His') . ".csv";

        return response()->streamDownload(function () use ($request, $reportType) {
            $handle = fopen('php://output', 'w');

            switch ($reportType) {
                case 'loads':
                case 'load':
                    fputcsv($handle, ['Load Number', 'Customer', 'Status', 'Driver', 'Vehicle', 'Created At']);
                    $loads = Order::where('company_uuid', session('company'))->with(['customer', 'driverAssigned', 'vehicleAssigned'])->get();
                    foreach ($loads as $l) {
                        fputcsv($handle, [$l->load_number ?: $l->public_id, $l->customer?->name, $l->status, $l->driverAssigned?->name, $l->vehicleAssigned?->plate_number, $l->created_at]);
                    }
                    break;

                case 'lr':
                    fputcsv($handle, ['LR Number', 'Date', 'Status', 'Customer', 'Vehicle', 'Driver', 'From', 'To']);
                    $lrs = LrNumber::where('company_uuid', session('company'))->with(['customer', 'vehicle', 'driver'])->get();
                    foreach ($lrs as $lr) {
                        fputcsv($handle, [$lr->lr_number, $lr->lr_date, $lr->status, $lr->customer?->name, $lr->vehicle?->plate_number, $lr->driver?->name, $lr->from_location, $lr->to_location]);
                    }
                    break;

                case 'bilty':
                    fputcsv($handle, ['Bilty Number', 'Date', 'Consignor', 'Consignee', 'Weight (T)', 'Freight', 'Advance', 'Balance', 'Payment Terms']);
                    $bilties = Bilty::where('company_uuid', session('company'))->with(['consignor', 'consignee'])->get();
                    foreach ($bilties as $b) {
                        fputcsv($handle, [$b->bilty_number, $b->bilty_date, $b->consignor?->name, $b->consignee?->name, $b->total_weight, $b->freight_amount, $b->advance_amount, $b->balance_amount, $b->payment_terms]);
                    }
                    break;

                case 'freight':
                case 'outstanding':
                    fputcsv($handle, ['Customer', 'Load', 'Freight Amount', 'Total Charges', 'Advance Paid', 'Deductions', 'Balance Payable', 'Payment Status']);
                    $charges = FreightCharge::where('company_uuid', session('company'))->with(['customer', 'order'])->get();
                    foreach ($charges as $c) {
                        fputcsv($handle, [$c->customer?->name, $c->order?->load_number ?: $c->order?->public_id, $c->freight_amount, $c->total_charges, $c->advance_paid, $c->deductions, $c->balance_payable, $c->payment_status]);
                    }
                    break;

                case 'document_expiry':
                default:
                    fputcsv($handle, ['Entity Type', 'Vehicle / Driver', 'Document Type', 'Document Number', 'Expiry Date']);
                    $vdocs = VehicleDocument::where('company_uuid', session('company'))->with('vehicle')->get();
                    foreach ($vdocs as $vd) {
                        fputcsv($handle, ['Vehicle', $vd->vehicle?->plate_number, $vd->document_type, $vd->document_number, $vd->expiry_date]);
                    }
                    $ddocs = DriverDocument::where('company_uuid', session('company'))->with('driver')->get();
                    foreach ($ddocs as $dd) {
                        fputcsv($handle, ['Driver', $dd->driver?->name, $dd->document_type, $dd->document_number, $dd->expiry_date]);
                    }
                    break;
            }

            fclose($handle);
        }, $fileName, ['Content-Type' => 'text/csv']);
    }

    /**
     * Export report as PDF.
     */
    public function exportPdf(Request $request, string $reportType)
    {
        $companyUuid = session('company', $request->user()?->company_uuid);
        $viewData = ['reportType' => $reportType, 'title' => strtoupper(str_replace('_', ' ', $reportType)) . ' REPORT'];

        switch ($reportType) {
            case 'lr':
                $viewData['records'] = LrNumber::where('company_uuid', $companyUuid)->with(['customer', 'vehicle', 'driver'])->limit(100)->get();
                break;
            case 'bilty':
                $viewData['records'] = Bilty::where('company_uuid', $companyUuid)->with(['consignor', 'consignee', 'vehicle'])->limit(100)->get();
                break;
            case 'freight':
            case 'outstanding':
                $viewData['records'] = FreightCharge::where('company_uuid', $companyUuid)->with(['customer', 'order'])->limit(100)->get();
                break;
            default:
                $viewData['records'] = Order::where('company_uuid', $companyUuid)->with(['customer', 'driverAssigned', 'vehicleAssigned'])->limit(100)->get();
                break;
        }

        $html = "<html><head><style>body{font-family:sans-serif;font-size:11px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:6px;text-align:left;} th{background:#eee;}</style></head><body><h2>{$viewData['title']}</h2><p>Generated: " . now()->toDateTimeString() . "</p>";

        $html .= "<table><thead><tr><th>ID</th><th>Details</th><th>Status / Balance</th><th>Date</th></tr></thead><tbody>";
        foreach ($viewData['records'] as $rec) {
            $label = $rec->lr_number ?? $rec->bilty_number ?? $rec->load_number ?? $rec->public_id ?? $rec->id;
            $details = $rec->customer?->name ?? $rec->vehicle?->plate_number ?? '';
            $status = $rec->status ?? $rec->payment_status ?? ($rec->balance_payable ?? '');
            $date = $rec->lr_date ?? $rec->bilty_date ?? $rec->created_at?->toDateString();
            $html .= "<tr><td>{$label}</td><td>{$details}</td><td>{$status}</td><td>{$date}</td></tr>";
        }
        $html .= "</tbody></table></body></html>";

        $pdf = Pdf::loadHTML($html)->setPaper('A4', 'portrait');

        return $pdf->stream("report-{$reportType}.pdf");
    }
}
