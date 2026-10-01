<?php

namespace Fleetbase\FleetOps\Models;

use Fleetbase\Models\File;
use Fleetbase\Models\Model;
use Fleetbase\Traits\HasApiModelBehavior;
use Fleetbase\Traits\HasPublicId;
use Fleetbase\Traits\HasUuid;
use Fleetbase\Traits\Searchable;
use Fleetbase\Traits\TracksApiCredential;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class DriverDocument extends Model
{
    use HasUuid;
    use HasPublicId;
    use TracksApiCredential;
    use HasApiModelBehavior;
    use Searchable;
    use LogsActivity;

    protected $table = 'driver_documents';

    protected string $publicIdType = 'drv_doc';

    protected $fillable = [
        'uuid',
        'public_id',
        'company_uuid',
        'driver_uuid',
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

    protected $searchableColumns = [
        'document_type',
        'document_label',
        'document_number',
        'issuing_authority',
        'notes',
        'public_id',
    ];

    protected $filterParams = [
        'driver_uuid',
        'document_type',
        'is_active',
    ];

    public static function boot()
    {
        parent::boot();

        static::saved(function ($doc) {
            // Update driving_license_expiry on Driver if applicable
            if ($doc->driver_uuid && $doc->expiry_date && $doc->is_active && $doc->document_type === 'driving_licence') {
                $driver = Driver::find($doc->driver_uuid);
                if ($driver) {
                    $driver->drivers_license_expiry = $doc->expiry_date;
                    $driver->saveQuietly();
                }
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['*'])->logOnlyDirty();
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_uuid', 'uuid');
    }

    public function file(): BelongsTo
    {
        return $this->belongsTo(File::class, 'file_uuid', 'uuid');
    }

    public function scopeExpiring(Builder $query, int $days = 30): Builder
    {
        $today = now()->toDateString();
        $future = now()->addDays($days)->toDateString();

        return $query->where('is_active', true)
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [$today, $future]);
    }
}
