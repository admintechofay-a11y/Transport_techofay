<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;

class TransportSetting extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;

    protected $table = 'transport_settings';

    protected string $publicIdType = 'trp_set';

    protected $fillable = [
        '_key',
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
        'custom_pdf_fields' => 'array',
        'whatsapp_settings' => 'array',
        'meta'              => 'array',
    ];

    /**
     * Get or create settings for a company.
     */
    public static function forCompany(string $companyUuid): static
    {
        return static::firstOrCreate(
            ['company_uuid' => $companyUuid],
            [
                'pdf_terms_conditions' => "1. Goods carried at owner's risk.\n2. All disputes subject to local jurisdiction only.\n3. Demurrage charges applicable after 24 hours of arrival.",
            ]
        );
    }
}
