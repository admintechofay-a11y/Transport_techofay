<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreightCharge extends Model
{
    use HasUuid;
    use HasPublicId;
    use BelongsToCompany;

    protected $table = 'freight_charges';

    protected string $publicIdType = 'frt_chg';

    protected $fillable = [
        '_key',
        'uuid',
        'public_id',
        'internal_id',
        'company_uuid',
        'load_uuid',
        'order_uuid',
        'trip_uuid',
        'customer_uuid',
        'freight_amount',
        'loading_charges',
        'unloading_charges',
        'detention_charges',
        'toll_charges',
        'handling_charges',
        'miscellaneous_charges',
        'additional_charges',
        'total_charges',
        'advance_paid',
        'deductions',
        'deduction_remarks',
        'balance_payable',
        'payment_status',
        'remarks',
        'created_by_uuid',
    ];

    protected $casts = [
        'additional_charges'    => 'array',
        'freight_amount'        => 'decimal:2',
        'loading_charges'       => 'decimal:2',
        'unloading_charges'     => 'decimal:2',
        'detention_charges'     => 'decimal:2',
        'toll_charges'          => 'decimal:2',
        'handling_charges'      => 'decimal:2',
        'miscellaneous_charges' => 'decimal:2',
        'total_charges'         => 'decimal:2',
        'advance_paid'          => 'decimal:2',
        'deductions'            => 'decimal:2',
        'balance_payable'       => 'decimal:2',
    ];

    public function setOrderUuidAttribute($value): void
    {
        $this->attributes['order_uuid'] = $value;
        if (!isset($this->attributes['load_uuid']) || empty($this->attributes['load_uuid'])) {
            $this->attributes['load_uuid'] = $value;
        }
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'load_uuid', 'uuid');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'customer_uuid', 'uuid');
    }
}
