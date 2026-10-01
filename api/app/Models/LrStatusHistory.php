<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;

class LrStatusHistory extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;

    protected $table = 'lr_status_histories';

    protected $publicIdType = 'lr_hist';

    protected $fillable = [
        '_key',
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
        'meta' => 'array',
    ];

    public function lrNumber()
    {
        return $this->belongsTo(LrNumber::class, 'lr_uuid', 'uuid');
    }
}
