<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverDocument extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;

    protected $table = 'driver_documents';

    protected $publicIdType = 'driver_doc';

    protected $fillable = [
        '_key',
        'uuid',
        'public_id',
        'company_uuid',
        'driver_uuid',
        'document_type',
        'document_label',
        'file_uuid',
        'file_url',
        'issued_date',
        'expiry_date',
        'issuing_authority',
        'document_number',
        'notes',
        'is_active',
        'created_by_uuid',
    ];

    protected $casts = [
        'issued_date' => 'date',
        'expiry_date' => 'date',
        'is_active'   => 'boolean',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_uuid');
    }
}
