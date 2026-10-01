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

class VehicleDocument extends Model
{
    use HasUuid;
    use HasPublicId;
    use TracksApiCredential;
    use HasApiModelBehavior;
    use Searchable;
    use LogsActivity;

    protected $table = 'vehicle_documents';

    protected string $publicIdType = 'veh_doc';

    protected $fillable = [
        'uuid',
        'public_id',
        'company_uuid',
        'vehicle_uuid',
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
        'vehicle_uuid',
        'document_type',
        'is_active',
    ];

    public static function boot()
    {
        parent::boot();

        static::saved(function ($doc) {
            // Update quick snapshot date on Vehicle if applicable
            if ($doc->vehicle_uuid && $doc->expiry_date && $doc->is_active) {
                $vehicle = Vehicle::find($doc->vehicle_uuid);
                if ($vehicle) {
                    $columnMap = [
                        'insurance'           => 'insurance_expiry',
                        'permit'              => 'permit_expiry',
                        'fitness_certificate' => 'fitness_expiry',
                        'puc'                 => 'puc_expiry',
                        'national_permit'     => 'national_permit_expiry',
                    ];

                    if (isset($columnMap[$doc->document_type])) {
                        $col = $columnMap[$doc->document_type];
                        $vehicle->{$col} = $doc->expiry_date;
                        $vehicle->saveQuietly();
                    }
                }
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['*'])->logOnlyDirty();
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_uuid', 'uuid');
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
