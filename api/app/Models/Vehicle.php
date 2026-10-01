<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\FleetOps\Models\Vehicle as FleetOpsVehicle;

class Vehicle extends FleetOpsVehicle
{
    use BelongsToCompany;
}
