<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bilty extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;

    protected $table = 'bilties';

    protected string $publicIdType = 'bilty';

    protected $fillable = [
        '_key',
        'uuid',
        'public_id',
        'internal_id',
        'company_uuid',
        'lr_uuid',
        'load_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'customer_uuid',
        'consignor_uuid',
        'consignee_uuid',
        'bilty_number',
        'bilty_date',
        'from_location',
        'to_location',
        'material_details',
        'total_weight',
        'freight_amount',
        'advance_amount',
        'balance_amount',
        'payment_terms',
        'remarks',
        'authorized_by',
        'meta',
        'created_by_uuid',
    ];

    protected $casts = [
        'material_details' => 'array',
        'meta'             => 'array',
        'bilty_date'       => 'date',
        'total_weight'     => 'decimal:2',
        'freight_amount'   => 'decimal:2',
        'advance_amount'   => 'decimal:2',
        'balance_amount'   => 'decimal:2',
    ];

    public function lrNumber(): BelongsTo
    {
        return $this->belongsTo(LrNumber::class, 'lr_uuid', 'uuid');
    }

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
