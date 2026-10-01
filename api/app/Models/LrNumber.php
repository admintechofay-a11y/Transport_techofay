<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\Order;
use Fleetbase\FleetOps\Models\Vehicle;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LrNumber extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;

    protected $table = 'lr_numbers';

    protected $publicIdType = 'lr';

    protected $fillable = [
        '_key',
        'uuid',
        'public_id',
        'internal_id',
        'company_uuid',
        'load_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'customer_uuid',
        'consignor_uuid',
        'consignee_uuid',
        'bilty_uuid',
        'lr_number',
        'generation_mode',
        'status',
        'from_location',
        'to_location',
        'lr_date',
        'remarks',
        'meta',
        'created_by_uuid',
        'updated_by_uuid',
    ];

    protected $casts = [
        'meta'    => 'array',
        'lr_date' => 'date',
    ];

    public function histories(): HasMany
    {
        return $this->hasMany(LrStatusHistory::class, 'lr_uuid', 'uuid')->orderBy('created_at', 'asc');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_uuid', 'uuid');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_uuid', 'uuid');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'load_uuid', 'uuid');
    }

    public function bilty(): BelongsTo
    {
        return $this->belongsTo(Bilty::class, 'bilty_uuid', 'uuid');
    }
}
