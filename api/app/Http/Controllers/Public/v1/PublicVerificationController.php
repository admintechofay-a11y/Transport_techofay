<?php

namespace App\Http\Controllers\Public\v1;

use App\Http\Controllers\Controller;
use App\Services\QrVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicVerificationController extends Controller
{
    protected QrVerificationService $service;

    public function __construct(QrVerificationService $service)
    {
        $this->service = $service;
    }

    /**
     * Publicly verify a document via signed QR token.
     * Rate-limited and sanitized to protect commercial secrecy.
     */
    public function verify(string $token, Request $request): JsonResponse
    {
        if (empty($token)) {
            return response()->json([
                'valid'   => false,
                'message' => 'Missing verification token.',
            ], 400);
        }

        $result = $this->service->getPublicVerificationData($token);

        if (!$result['valid']) {
            $status = ($result['status'] ?? '') === 'not_found' ? 404 : 403;
            return response()->json($result, $status);
        }

        return response()->json($result);
    }
}
