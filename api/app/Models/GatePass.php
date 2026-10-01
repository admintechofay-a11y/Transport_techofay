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
use Illuminate\Database\Eloquent\SoftDeletes;

class GatePass extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;
    use SoftDeletes;

    protected $table = 'gate_passes';

    protected string $publicIdType = 'gate_pass';

    protected $fillable = [
        '_key',
        'uuid',
        'public_id',
        'company_uuid',
        'load_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'gate_pass_number',
        'pass_type',
        'in_time',
        'out_time',
        'authorized_by',
        'security_name',
        'remarks',
        'qr_token',
    ];

    protected $casts = [
        'in_time'  => 'datetime',
        'out_time' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'load_uuid', 'uuid');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_uuid', 'uuid');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_uuid', 'uuid');
    }
}
