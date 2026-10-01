<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleDocument extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;

    protected $table = 'vehicle_documents';

    protected $publicIdType = 'vehicle_doc';

    protected $fillable = [
        '_key',
        'uuid',
        'public_id',
        'company_uuid',
        'vehicle_uuid',
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

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_uuid');
    }
}
