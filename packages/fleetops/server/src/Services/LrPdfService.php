<?php

namespace Fleetbase\FleetOps\Services;

use Fleetbase\FleetOps\Models\LrNumber;

class LrPdfService
{
    public static function generate(LrNumber $lr)
    {
        $service = app(PdfGenerationService::class);
        return $service->generateLr($lr);
    }
}
