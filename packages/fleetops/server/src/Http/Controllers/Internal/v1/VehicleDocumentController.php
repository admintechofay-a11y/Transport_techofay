<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\Vehicle;
use Fleetbase\FleetOps\Models\VehicleDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VehicleDocumentController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'vehicle-document';

    /**
     * Resolve Vehicle Document by ID, UUID or Public ID.
     */
    protected function resolveDocument(string $id): ?VehicleDocument
    {
        $companyUuid = session('company');

        return VehicleDocument::where(function ($query) use ($id) {
            $query->where('uuid', $id)->orWhere('public_id', $id);
        })
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->first();
    }

    /**
     * Download or stream document file.
     */
    public function download(string $id)
    {
        $doc = $this->resolveDocument($id);

        if (!$doc) {
            return response()->json(['error' => 'Vehicle document not found.'], 404);
        }

        // If file_url is external or S3 URL
        if (!empty($doc->file_url)) {
            // Check if local storage path
            if (Storage::exists($doc->file_url)) {
                return Storage::download($doc->file_url, basename($doc->file_url));
            }

            // S3 temporary signed URL
            try {
                if (Storage::disk('s3')->exists($doc->file_url)) {
                    $temporaryUrl = Storage::disk('s3')->temporaryUrl(
                        $doc->file_url,
                        now()->addMinutes(30)
                    );
                    return redirect()->away($temporaryUrl);
                }
            } catch (\Throwable $e) {
                // Disk not configured or file not on S3
            }

            return redirect()->away($doc->file_url);
        }

        // If linked to Fleetbase File model
        if ($doc->file) {
            $file = $doc->file;
            if (!empty($file->url)) {
                return redirect()->away($file->url);
            }
        }

        return response()->json(['error' => 'File not found or has no attached document file.'], 404);
    }

    /**
     * Get documents expiring within X days (default 30).
     */
    public function getExpiring(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);
        $companyUuid = session('company', $request->user()?->company_uuid);

        $documents = VehicleDocument::with(['vehicle'])
            ->when($companyUuid, fn ($q) => $q->where('company_uuid', $companyUuid))
            ->where('is_active', true)
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [now()->toDateString(), now()->addDays($days)->toDateString()])
            ->orderBy('expiry_date', 'asc')
            ->get();

        $grouped = $documents->groupBy(function ($doc) {
            return $doc->vehicle ? ($doc->vehicle->plate_number ?: $doc->vehicle->name ?: $doc->vehicle->public_id) : 'Unassigned';
        });

        return response()->json([
            'days_threshold' => $days,
            'total_expiring' => $documents->count(),
            'grouped'        => $grouped,
            'documents'      => $documents,
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
