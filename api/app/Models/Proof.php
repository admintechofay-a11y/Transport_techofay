<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proof extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;
    use SoftDeletes;

    protected $table = 'proofs';

    protected $publicIdType = 'proof';

    protected $fillable = [
        'company_uuid',
        'file_uuid',
        'order_uuid',
        'subject_uuid',
        'subject_type',
        'remarks',
        'raw_data',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    /**
     * Associated order / load.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_uuid', 'uuid');
    }
}
