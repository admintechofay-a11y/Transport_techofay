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
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class DeliveryChallan extends Model
{
    use HasUuid;
    use HasPublicId;
    use TracksApiCredential;
    use HasApiModelBehavior;
    use Searchable;
    use LogsActivity;
    use HasMetaAttributes;

    protected $table = 'delivery_challans';

    protected string $publicIdType = 'dc';

    protected $fillable = [
        'uuid',
        'public_id',
        'company_uuid',
        'load_uuid',
        'load_location_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'consignee_uuid',
        'challan_number',
        'challan_date',
        'material_items',
        'total_quantity',
        'total_weight',
        'status',
        'delivered_at',
        'received_by',
        'remarks',
    ];

    protected $casts = [
        'material_items' => Json::class,
        'challan_date'   => 'date',
        'delivered_at'   => 'datetime',
        'total_quantity' => 'decimal:2',
        'total_weight'   => 'decimal:2',
    ];

    protected $searchableColumns = [
        'challan_number',
        'received_by',
        'remarks',
        'status',
        'public_id',
    ];

    protected $filterParams = [
        'load_uuid',
        'load_location_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'consignee_uuid',
        'status',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($challan) {
            // Auto-generate challan_number: DC-{YEAR}-{seq}
            if (empty($challan->challan_number)) {
                $year = now()->format('Y');
                $lastSeq = static::where('company_uuid', $challan->company_uuid)
                    ->whereYear('created_at', $year)
                    ->max(DB::raw('CAST(SUBSTRING_INDEX(challan_number, "-", -1) AS UNSIGNED)'));
                $seq = str_pad(($lastSeq ?? 0) + 1, 6, '0', STR_PAD_LEFT);
                $challan->challan_number = "DC-{$year}-{$seq}";
            }

            // Auto-fill from Order if load_uuid provided
            if ($challan->load_uuid) {
                $order = Order::find($challan->load_uuid);
                if ($order) {
                    if (!$challan->vehicle_uuid) {
                        $challan->vehicle_uuid = $order->vehicle_assigned_uuid;
                    }
                    if (!$challan->driver_uuid) {
                        $challan->driver_uuid = $order->driver_assigned_uuid;
                    }
                }
            }

            if (static::where('challan_number', $challan->challan_number)->where('company_uuid', $challan->company_uuid)->exists()) {
                throw new \Exception("Delivery Challan Number {$challan->challan_number} already exists.");
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

    public function loadLocation(): BelongsTo
    {
        return $this->belongsTo(LoadLocation::class, 'load_location_uuid', 'uuid');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_uuid', 'uuid');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_uuid', 'uuid');
    }

    public function consignee(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'consignee_uuid', 'uuid');
    }
}
