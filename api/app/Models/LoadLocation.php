<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoadLocation extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;

    protected $table = 'load_locations';

    protected string $publicIdType = 'loc';

    protected $fillable = [
        '_key',
        'uuid',
        'public_id',
        'internal_id',
        'company_uuid',
        'load_uuid',
        'place_uuid',
        'sequence',
        'location_type',
        'contact_name',
        'contact_phone',
        'material_items',
        'total_quantity',
        'total_weight',
        'status',
        'completed_at',
        'completed_by_uuid',
        'remarks',
    ];

    protected $casts = [
        'material_items' => 'array',
        'sequence'       => 'integer',
        'total_quantity' => 'decimal:2',
        'total_weight'   => 'decimal:2',
        'completed_at'   => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'load_uuid', 'uuid');
    }
}
