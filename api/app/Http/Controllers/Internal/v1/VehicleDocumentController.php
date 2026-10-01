<?php

namespace App\Http\Controllers\Internal\v1;

use App\Models\VehicleDocument;
use App\Services\DocumentComplianceService;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VehicleDocumentController extends FleetOpsController
{
    public $resource = 'vehicle-document';

    protected DocumentComplianceService $complianceService;

    public function __construct(DocumentComplianceService $complianceService)
    {
        $this->complianceService = $complianceService;
    }

    /**
     * Store or replace a vehicle document with optional file upload.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'vehicle_uuid'  => 'required|string',
            'document_type' => 'required|string',
            'expiry_date'   => 'nullable|date',
            'file'          => 'nullable|file|max:10240', // up to 10MB
        ]);

        $vehicle = Vehicle::where('uuid', $request->input('vehicle_uuid'))
            ->orWhere('public_id', $request->input('vehicle_uuid'))
            ->firstOrFail();

        $file = $request->file('file');
        $expiryDate = $request->input('expiry_date');
        $documentType = $request->input('document_type');

        $doc = $this->complianceService->storeVehicleDocument(
            $vehicle,
            $documentType,
            $expiryDate,
            $file,
            [
                'document_number'   => $request->input('document_number'),
                'issuing_authority' => $request->input('issuing_authority'),
                'notes'             => $request->input('notes'),
            ]
        );

        return response()->json([
            'vehicle_document' => $doc,
            'status'           => $this->complianceService->evaluateStatus($doc->expiry_date),
            'message'          => 'Vehicle document stored successfully.',
        ], 201);
    }

    /**
     * Download document file.
     */
    public function download(string $id)
    {
        $doc = VehicleDocument::where(function ($q) use ($id) {
            $q->where('uuid', $id)->orWhere('public_id', $id);
        })->first();

        if (!$doc) {
            return response()->json(['error' => 'Vehicle document not found.'], 404);
        }

        if (empty($doc->file_url)) {
            return response()->json(['error' => 'No file attached to this document.'], 404);
        }

        if (Storage::disk('local')->exists($doc->file_url)) {
            return Storage::disk('local')->download($doc->file_url, basename($doc->file_url));
        }

        return response()->json(['error' => 'Document file not found on storage disk.'], 404);
    }

    /**
     * Delete document.
     */
    public function destroy($id, Request $request)
    {
        $doc = VehicleDocument::where(function ($q) use ($id) {
            $q->where('uuid', $id)->orWhere('public_id', $id);
        })->first();

        if (!$doc) {
            return response()->json(['error' => 'Vehicle document not found.'], 404);
        }

        $doc->is_active = false;
        $doc->save();
        $doc->delete();

        return response()->json(['message' => 'Vehicle document removed successfully.']);
    }

    /**
     * Get expiring documents.
     */
    public function getExpiring(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);
        $companyUuid = session('company', $request->header('Company-Header'));

        $documents = VehicleDocument::where('is_active', true)
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [now()->toDateString(), now()->addDays($days)->toDateString()])
            ->orderBy('expiry_date', 'asc')
            ->get();

        return response()->json([
            'days_threshold' => $days,
            'total_expiring' => $documents->count(),
            'documents'      => $documents,
        ]);
    }
}
