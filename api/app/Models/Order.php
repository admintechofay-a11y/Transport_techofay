<?php

namespace App\Models;

use Fleetbase\FleetOps\Models\Order as FleetOpsOrder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends FleetOpsOrder
{
    protected $fillable = [
        '_key',
        'uuid',
        'public_id',
        'internal_id',
        'company_uuid',
        'load_number',
        'status',
        'orchestrator_priority',
        'adhoc',
        'dispatched',
        'dispatched_at',
        'started',
        'started_at',
        'delivered_at',
        'customer_uuid',
        'customer_type',
        'facilitator_uuid',
        'facilitator_type',
        'driver_assigned_uuid',
        'vehicle_assigned_uuid',
        'tracking_number_uuid',
        'payload_uuid',
        'meta',
        'options',
    ];

    public function customer(): \Illuminate\Database\Eloquent\Relations\MorphTo
    {
        if (empty($this->customer_type)) {
            $this->customer_type = \Fleetbase\FleetOps\Models\Contact::class;
        }

        return parent::customer();
    }

    public function locations(): HasMany
    {
        return $this->hasMany(LoadLocation::class, 'load_uuid', 'uuid')->orderBy('sequence');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_assigned_uuid', 'uuid');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_assigned_uuid', 'uuid');
    }
}
