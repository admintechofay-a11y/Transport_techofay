<?php

namespace Fleetbase\FleetOps\Models;

use Fleetbase\Casts\Json;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasApiModelBehavior;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Fleetbase\Traits\Searchable;
use Fleetbase\Traits\TracksApiCredential;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class LoadLocation extends Model
{
    use HasUuid;
    use HasPublicId;
    use TracksApiCredential;
    use HasApiModelBehavior;
    use Searchable;
    use LogsActivity;

    protected $table = 'load_locations';

    protected string $publicIdType = 'load_loc';

    protected $fillable = [
        'uuid',
        'public_id',
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
        'material_items' => Json::class,
        'sequence'       => 'integer',
        'total_quantity' => 'decimal:2',
        'total_weight'   => 'decimal:2',
        'completed_at'   => 'datetime',
    ];

    protected $searchableColumns = [
        'contact_name',
        'contact_phone',
        'location_type',
        'status',
        'remarks',
        'public_id',
    ];

    protected $filterParams = [
        'load_uuid',
        'place_uuid',
        'location_type',
        'status',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['*'])->logOnlyDirty();
    }

    public function load(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'load_uuid', 'uuid');
    }

    public function order(): BelongsTo
    {
        return $this->load();
    }

    public function place(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'place_uuid', 'uuid');
    }

    public function deliveryChallans(): HasMany
    {
        return $this->hasMany(DeliveryChallan::class, 'load_location_uuid', 'uuid');
    }
}
