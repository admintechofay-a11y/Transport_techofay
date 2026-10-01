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

class LrNumber extends Model
{
    use HasUuid;
    use HasPublicId;
    use TracksApiCredential;
    use HasApiModelBehavior;
    use Searchable;
    use LogsActivity;
    use HasMetaAttributes;

    protected $table = 'lr_numbers';

    protected string $publicIdType = 'lr';

    protected $fillable = [
        'uuid',
        'public_id',
        'company_uuid',
        'load_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'customer_uuid',
        'consignor_uuid',
        'consignee_uuid',
        'bilty_uuid',
        'lr_number',
        'generation_mode',
        'status',
        'from_location',
        'to_location',
        'lr_date',
        'remarks',
        'meta',
        'created_by_uuid',
        'updated_by_uuid',
    ];

    protected $casts = [
        'meta'    => Json::class,
        'lr_date' => 'date',
    ];

    protected $searchableColumns = [
        'lr_number',
        'from_location',
        'to_location',
        'status',
        'remarks',
        'public_id',
    ];

    protected $filterParams = [
        'status',
        'load_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'customer_uuid',
        'consignor_uuid',
        'consignee_uuid',
        'bilty_uuid',
        'generation_mode',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($lr) {
            // Auto-populate from Load (Order) if load_uuid provided and attributes missing
            if ($lr->load_uuid && (!$lr->vehicle_uuid || !$lr->driver_uuid || !$lr->customer_uuid)) {
                $order = Order::find($lr->load_uuid);
                if ($order) {
                    if (!$lr->customer_uuid && $order->customer_uuid) {
                        $lr->customer_uuid = $order->customer_uuid;
                    }
                    if (!$lr->driver_uuid && $order->driver_assigned_uuid) {
                        $lr->driver_uuid = $order->driver_assigned_uuid;
                    }
                    if (!$lr->vehicle_uuid) {
                        if ($order->vehicle_assigned_uuid) {
                            $lr->vehicle_uuid = $order->vehicle_assigned_uuid;
                        } elseif ($order->driver_assigned_uuid) {
                            $driver = Driver::find($order->driver_assigned_uuid);
                            if ($driver && $driver->vehicle_uuid) {
                                $lr->vehicle_uuid = $driver->vehicle_uuid;
                            }
                        }
                    }
                }
            }

            // Auto-generate lr_number if generation_mode is auto or empty
            if ($lr->generation_mode === 'auto' || empty($lr->lr_number)) {
                $year = now()->format('Y');
                $lastSeq = static::where('company_uuid', $lr->company_uuid)
                    ->whereYear('created_at', $year)
                    ->max(DB::raw('CAST(SUBSTRING_INDEX(lr_number, "-", -1) AS UNSIGNED)'));
                $seq = str_pad(($lastSeq ?? 0) + 1, 6, '0', STR_PAD_LEFT);
                $lr->lr_number = "LR-{$year}-{$seq}";
                $lr->generation_mode = 'auto';
            }

            // Unique validation check
            if (static::where('lr_number', $lr->lr_number)->where('company_uuid', $lr->company_uuid)->exists()) {
                throw new \Exception("LR Number {$lr->lr_number} already exists.");
            }
        });

        static::created(function ($lr) {
            // Record initial status in history
            LrStatusHistory::create([
                'company_uuid'    => $lr->company_uuid,
                'lr_uuid'         => $lr->uuid,
                'from_status'     => null,
                'to_status'       => $lr->status ?? 'draft',
                'remarks'         => 'Initial LR creation',
                'changed_by_uuid' => $lr->created_by_uuid,
            ]);
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

    public function bilty(): BelongsTo
    {
        return $this->belongsTo(Bilty::class, 'bilty_uuid', 'uuid');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(LrStatusHistory::class, 'lr_uuid', 'uuid')->orderBy('created_at', 'desc');
    }

    public function statusHistories(): HasMany
    {
        return $this->statusHistory();
    }
}
