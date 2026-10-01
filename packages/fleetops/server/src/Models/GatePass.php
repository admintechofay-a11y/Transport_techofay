<?php

namespace Fleetbase\FleetOps\Models;

use Fleetbase\Models\Model;
use Fleetbase\Traits\HasApiModelBehavior;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Fleetbase\Traits\Searchable;
use Fleetbase\Traits\TracksApiCredential;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class GatePass extends Model
{
    use HasUuid;
    use HasPublicId;
    use TracksApiCredential;
    use HasApiModelBehavior;
    use Searchable;
    use LogsActivity;

    protected $table = 'gate_passes';

    protected string $publicIdType = 'gp';

    protected $fillable = [
        'uuid',
        'public_id',
        'company_uuid',
        'load_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'gate_pass_number',
        'pass_type',
        'in_time',
        'out_time',
        'authorized_by',
        'security_name',
        'remarks',
    ];

    protected $casts = [
        'in_time'  => 'datetime',
        'out_time' => 'datetime',
    ];

    protected $searchableColumns = [
        'gate_pass_number',
        'authorized_by',
        'security_name',
        'pass_type',
        'remarks',
        'public_id',
    ];

    protected $filterParams = [
        'load_uuid',
        'vehicle_uuid',
        'driver_uuid',
        'pass_type',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($gp) {
            // Auto-generate gate_pass_number: GP-{YEAR}-{seq}
            if (empty($gp->gate_pass_number)) {
                $year = now()->format('Y');
                $lastSeq = static::where('company_uuid', $gp->company_uuid)
                    ->whereYear('created_at', $year)
                    ->max(DB::raw('CAST(SUBSTRING_INDEX(gate_pass_number, "-", -1) AS UNSIGNED)'));
                $seq = str_pad(($lastSeq ?? 0) + 1, 6, '0', STR_PAD_LEFT);
                $gp->gate_pass_number = "GP-{$year}-{$seq}";
            }

            if (static::where('gate_pass_number', $gp->gate_pass_number)->where('company_uuid', $gp->company_uuid)->exists()) {
                throw new \Exception("Gate Pass Number {$gp->gate_pass_number} already exists.");
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

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_uuid', 'uuid');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_uuid', 'uuid');
    }
}
