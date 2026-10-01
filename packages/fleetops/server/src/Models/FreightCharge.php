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
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class FreightCharge extends Model
{
    use HasUuid;
    use HasPublicId;
    use TracksApiCredential;
    use HasApiModelBehavior;
    use Searchable;
    use LogsActivity;

    protected $table = 'freight_charges';

    protected string $publicIdType = 'frt_chg';

    protected $fillable = [
        'uuid',
        'public_id',
        'company_uuid',
        'load_uuid',
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
        'additional_charges'    => Json::class,
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

    protected $searchableColumns = [
        'payment_status',
        'remarks',
        'deduction_remarks',
        'public_id',
    ];

    protected $filterParams = [
        'load_uuid',
        'trip_uuid',
        'customer_uuid',
        'payment_status',
    ];

    public static function boot()
    {
        parent::boot();

        static::saving(function ($fc) {
            $extra = 0.0;
            if (is_array($fc->additional_charges)) {
                $extra = (float) collect($fc->additional_charges)->sum('amount');
            }

            $fc->total_charges = (float) ($fc->freight_amount ?? 0)
                + (float) ($fc->loading_charges ?? 0)
                + (float) ($fc->unloading_charges ?? 0)
                + (float) ($fc->detention_charges ?? 0)
                + (float) ($fc->toll_charges ?? 0)
                + (float) ($fc->handling_charges ?? 0)
                + (float) ($fc->miscellaneous_charges ?? 0)
                + $extra;

            $fc->balance_payable = (float) $fc->total_charges
                - (float) ($fc->advance_paid ?? 0)
                - (float) ($fc->deductions ?? 0);

            if ($fc->balance_payable <= 0 && $fc->total_charges > 0) {
                $fc->payment_status = 'paid';
            } elseif ($fc->advance_paid > 0 && $fc->balance_payable > 0) {
                $fc->payment_status = 'partial';
            } else {
                $fc->payment_status = 'pending';
            }
        });
    }

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

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'customer_uuid', 'uuid');
    }
}
