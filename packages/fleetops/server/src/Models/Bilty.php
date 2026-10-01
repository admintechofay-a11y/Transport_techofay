<?php

namespace Fleetbase\FleetOps\Models;

use Fleetbase\Casts\Json;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasApiModelBehavior;
use Fleetbase\Traits\HasMetaAttributes;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Fleetbase\Traits\Searchable;
use Fleetbase\Traits\TracksApiCredential;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Bilty extends Model
{
    use HasUuid;
    use HasPublicId;
    use TracksApiCredential;
    use HasApiModelBehavior;
    use Searchable;
    use LogsActivity;
    use HasMetaAttributes;

    protected $table = 'bilties';

    protected string $publicIdType = 'bilty';

    protected $fillable = [
        'uuid',
        'public_id',
        'company_uuid',
        'lr_uuid',
        'load_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'customer_uuid',
        'consignor_uuid',
        'consignee_uuid',
        'bilty_number',
        'bilty_date',
        'from_location',
        'to_location',
        'material_details',
        'total_weight',
        'freight_amount',
        'advance_amount',
        'balance_amount',
        'payment_terms',
        'remarks',
        'authorized_by',
        'meta',
        'created_by_uuid',
    ];

    protected $casts = [
        'material_details' => Json::class,
        'meta'             => Json::class,
        'bilty_date'       => 'date',
        'total_weight'     => 'decimal:2',
        'freight_amount'   => 'decimal:2',
        'advance_amount'   => 'decimal:2',
        'balance_amount'   => 'decimal:2',
    ];

    protected $searchableColumns = [
        'bilty_number',
        'from_location',
        'to_location',
        'remarks',
        'authorized_by',
        'public_id',
    ];

    protected $filterParams = [
        'payment_terms',
        'lr_uuid',
        'load_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'customer_uuid',
        'consignor_uuid',
        'consignee_uuid',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($bilty) {
            // Auto-populate from LR if lr_uuid provided
            if ($bilty->lr_uuid) {
                $lr = LrNumber::find($bilty->lr_uuid);
                if ($lr) {
                    if (!$bilty->load_uuid && $lr->load_uuid) {
                        $bilty->load_uuid = $lr->load_uuid;
                    }
                    if (!$bilty->vehicle_uuid && $lr->vehicle_uuid) {
                        $bilty->vehicle_uuid = $lr->vehicle_uuid;
                    }
                    if (!$bilty->driver_uuid && $lr->driver_uuid) {
                        $bilty->driver_uuid = $lr->driver_uuid;
                    }
                    if (!$bilty->customer_uuid && $lr->customer_uuid) {
                        $bilty->customer_uuid = $lr->customer_uuid;
                    }
                    if (!$bilty->consignor_uuid && $lr->consignor_uuid) {
                        $bilty->consignor_uuid = $lr->consignor_uuid;
                    }
                    if (!$bilty->consignee_uuid && $lr->consignee_uuid) {
                        $bilty->consignee_uuid = $lr->consignee_uuid;
                    }
                    if (!$bilty->from_location && $lr->from_location) {
                        $bilty->from_location = $lr->from_location;
                    }
                    if (!$bilty->to_location && $lr->to_location) {
                        $bilty->to_location = $lr->to_location;
                    }
                }
            }

            // Auto-generate bilty_number: BL-{YEAR}-{6-digit-seq}
            if (empty($bilty->bilty_number)) {
                $year = now()->format('Y');
                $lastSeq = static::where('company_uuid', $bilty->company_uuid)
                    ->whereYear('created_at', $year)
                    ->max(DB::raw('CAST(SUBSTRING_INDEX(bilty_number, "-", -1) AS UNSIGNED)'));
                $seq = str_pad(($lastSeq ?? 0) + 1, 6, '0', STR_PAD_LEFT);
                $bilty->bilty_number = "BL-{$year}-{$seq}";
            }

            if (static::where('bilty_number', $bilty->bilty_number)->where('company_uuid', $bilty->company_uuid)->exists()) {
                throw new \Exception("Bilty Number {$bilty->bilty_number} already exists.");
            }
        });

        static::saving(function ($bilty) {
            $freight = (float) ($bilty->freight_amount ?? 0);
            $advance = (float) ($bilty->advance_amount ?? 0);
            $bilty->balance_amount = $freight - $advance;
        });

        static::created(function ($bilty) {
            // Link back to LR if LR doesn't have bilty_uuid
            if ($bilty->lr_uuid) {
                $lr = LrNumber::find($bilty->lr_uuid);
                if ($lr && !$lr->bilty_uuid) {
                    $lr->bilty_uuid = $bilty->uuid;
                    $lr->saveQuietly();
                }
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['*'])->logOnlyDirty();
    }

    public function lrNumber(): BelongsTo
    {
        return $this->belongsTo(LrNumber::class, 'lr_uuid', 'uuid');
    }

    public function load(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'load_uuid', 'uuid');
    }

    public function order(): BelongsTo
    {
        return $this->load();
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_uuid', 'uuid');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_uuid', 'uuid');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'customer_uuid', 'uuid');
    }

    public function consignor(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'consignor_uuid', 'uuid');
    }

    public function consignee(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'consignee_uuid', 'uuid');
    }

    public function deliveryChallans(): HasMany
    {
        return $this->hasMany(DeliveryChallan::class, 'load_uuid', 'load_uuid');
    }
}
