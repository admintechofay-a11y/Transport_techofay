<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\DriverDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DriverDocumentController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'driver-document';

    /**
     * Resolve Driver Document by ID, UUID or Public ID.
     */
    protected function resolveDocument(string $id): ?DriverDocument
    {
        $companyUuid = session('company');

        return DriverDocument::where(function ($query) use ($id) {
            $query->where('uuid', $id)->orWhere('public_id', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Download or stream driver document file.
     */
    public function download(string $id)
    {
        $doc = $this->resolveDocument($id);

        if (!$doc) {
            return response()->json(['error' => 'Driver document not found.'], 404);
        }

        // If file_url is set
        if (!empty($doc->file_url)) {
            if (Storage::exists($doc->file_url)) {
                return Storage::download($doc->file_url, basename($doc->file_url));
            }

            try {
                if (Storage::disk('s3')->exists($doc->file_url)) {
                    $temporaryUrl = Storage::disk('s3')->temporaryUrl(
                        $doc->file_url,
                        now()->addMinutes(30)
                    );
                    return redirect()->away($temporaryUrl);
                }
            } catch (\Throwable $e) {
                // Disk not configured
            }

            return redirect()->away($doc->file_url);
        }

        if ($doc->file) {
            $file = $doc->file;
            if (!empty($file->url)) {
                return redirect()->away($file->url);
            }
        }

        return response()->json(['error' => 'File not found or has no attached document file.'], 404);
    }

    /**
     * Get driver documents and licenses expiring within X days (default 30).
     */
    public function getExpiring(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);
        $companyUuid = session('company', $request->user()?->company_uuid);

        $documents = DriverDocument::with(['driver'])
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->where('is_active', true)
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [now()->toDateString(), now()->addDays($days)->toDateString()])
            ->orderBy('expiry_date', 'asc')
            ->get();

        $driversWithExpiringLicenses = Driver::when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->whereNotNull('drivers_license_expiry')
            ->whereBetween('drivers_license_expiry', [now()->toDateString(), now()->addDays($days)->toDateString()])
            ->get();

        $grouped = $documents->groupBy(function ($doc) {
            return $doc->driver ? ($doc->driver->name ?: $doc->driver->public_id) : 'Unassigned';
        });

        return response()->json([
            'days_threshold'               => $days,
            'total_expiring_documents'     => $documents->count(),
            'total_expiring_licenses'      => $driversWithExpiringLicenses->count(),
            'grouped'                      => $grouped,
            'documents'                    => $documents,
            'drivers_with_expiring_licence' => $driversWithExpiringLicenses,
        ]);
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
