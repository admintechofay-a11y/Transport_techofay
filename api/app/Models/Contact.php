<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\FleetOps\Models\Contact as FleetOpsContact;

class Contact extends FleetOpsContact
{
    use BelongsToCompany;

    protected $fillable = [
        '_key',
        'uuid',
        'public_id',
        'internal_id',
        'company_uuid',
        'user_uuid',
        'place_uuid',
        'photo_uuid',
        'name',
        'title',
        'email',
        'phone',
        'type',
        'party_type',
        'gstin',
        'pan_number',
        'billing_address',
        'delivery_address',
        'billing_city',
        'billing_state',
        'billing_pincode',
        'payment_terms',
        'notes',
        'meta',
        'slug',
    ];
}
