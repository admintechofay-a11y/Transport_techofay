<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\FleetOps\Models\Contact;
use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\Order;
use Fleetbase\FleetOps\Models\Vehicle;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeliveryChallan extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;
    use SoftDeletes;

    protected $table = 'delivery_challans';

    protected string $publicIdType = 'delivery_challan';

    protected $fillable = [
        '_key',
        'uuid',
        'public_id',
        'company_uuid',
        'load_uuid',
        'load_location_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'consignee_uuid',
        'challan_number',
        'challan_date',
        'material_items',
        'total_quantity',
        'total_weight',
        'status',
        'delivered_at',
        'received_by',
        'remarks',
    ];

    protected $casts = [
        'material_items' => 'array',
        'total_quantity' => 'decimal:2',
        'total_weight'   => 'decimal:2',
        'delivered_at'   => 'datetime',
        'challan_date'   => 'date',
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

    public function consignee(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'consignee_uuid', 'uuid');
    }
}
