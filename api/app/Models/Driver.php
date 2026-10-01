<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\FleetOps\Models\Driver as FleetOpsDriver;

class Driver extends FleetOpsDriver
{
    use BelongsToCompany;

    public function getNameAttribute()
    {
        return $this->attributes['name'] ?? data_get($this, 'user.name');
    }

    public function getPhoneAttribute()
    {
        return $this->attributes['phone'] ?? data_get($this, 'user.phone');
    }
}
