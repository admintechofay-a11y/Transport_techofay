<?php

namespace Fleetbase\FleetOps\Models;

use Fleetbase\Casts\Json;
use Fleetbase\Models\Company;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasApiModelBehavior;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class TransportSetting extends Model
{
    use HasUuid;
    use HasPublicId;
    use HasApiModelBehavior;
    use LogsActivity;

    protected $table = 'transport_settings';

    protected string $publicIdType = 'trp_set';

    protected $fillable = [
        'uuid',
        'public_id',
        'company_uuid',
        'company_logo_url',
        'gstin',
        'company_address',
        'company_phone',
        'company_email',
        'pdf_terms_conditions',
        'signature_url',
        'custom_pdf_fields',
        'whatsapp_settings',
        'meta',
    ];

    protected $casts = [
        'custom_pdf_fields' => Json::class,
        'whatsapp_settings' => Json::class,
        'meta'              => Json::class,
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['*'])->logOnlyDirty();
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_uuid', 'uuid');
    }

    /**
     * Get or create settings for a company.
     */
    public static function forCompany(string $companyUuid): static
    {
        return static::firstOrCreate(
            ['company_uuid' => $companyUuid],
            [
                'pdf_terms_conditions' => '1. Goods carried at owner\'s risk.\n2. All disputes subject to local jurisdiction only.\n3. Demurrage charges applicable after 24 hours of arrival.',
            ]
        );
    }
}
