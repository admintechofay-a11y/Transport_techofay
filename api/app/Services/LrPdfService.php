<?php

namespace App\Services;

use Fleetbase\FleetOps\Models\LrNumber;
use App\Services\PdfGenerationService;

class LrPdfService
{
    public static function generate(LrNumber $lr)
    {
        $service = app(PdfGenerationService::class);
        return $service->generateLr($lr);
    }
}
