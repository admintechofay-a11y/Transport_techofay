<?php

namespace Fleetbase\FleetOps\Models;

use Fleetbase\Casts\Json;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasApiModelBehavior;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LrStatusHistory extends Model
{
    use HasUuid;
    use HasPublicId;
    use HasApiModelBehavior;

    protected $table = 'lr_status_histories';

    protected string $publicIdType = 'lr_hist';

    protected $fillable = [
        'uuid',
        'public_id',
        'company_uuid',
        'lr_uuid',
        'from_status',
        'to_status',
        'remarks',
        'changed_by_uuid',
        'meta',
    ];

    protected $casts = [
        'meta' => Json::class,
    ];

    public function lrNumber(): BelongsTo
    {
        return $this->belongsTo(LrNumber::class, 'lr_uuid', 'uuid');
    }
}
