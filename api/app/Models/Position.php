<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Fleetbase\FleetOps\Models\Position as FleetOpsPosition;
use Fleetbase\LaravelMysqlSpatial\Types\Point as SpatialPoint;
use Illuminate\Database\Query\Builder as BaseQueryBuilder;
use Illuminate\Support\Facades\DB;

class Position extends FleetOpsPosition
{
    use BelongsToCompany;

    protected $table = 'positions';

    protected $fillable = [
        '_key',
        'uuid',
        'company_uuid',
        'order_uuid',
        'destination_uuid',
        'subject_uuid',
        'subject_type',
        'coordinates',
        'heading',
        'bearing',
        'speed',
        'altitude',
    ];

    /**
     * Override newBaseQueryBuilder to use standard query builder on SQLite.
     */
    protected function newBaseQueryBuilder()
    {
        $connection = $this->getConnection();

        if ($connection->getDriverName() === 'sqlite') {
            return new BaseQueryBuilder(
                $connection,
                $connection->getQueryGrammar(),
                $connection->getPostProcessor()
            );
        }

        return parent::newBaseQueryBuilder();
    }

    /**
     * Prevent SpatialTrait from treating SQLite text/json as WKB binary.
     */
    public function setRawAttributes(array $attributes, $sync = false)
    {
        if ($this->getConnection()->getDriverName() === 'sqlite') {
            $this->attributes = $attributes;
            if ($sync) {
                $this->syncOriginal();
            }
            return $this;
        }

        return parent::setRawAttributes($attributes, $sync);
    }

    /**
     * Spatial-aware coordinates setter compatible with SQLite test databases and MySQL.
     */
    public function setCoordinatesAttribute($value): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            if ($value instanceof SpatialPoint) {
                $this->attributes['coordinates'] = json_encode(['lat' => $value->getLat(), 'lng' => $value->getLng()]);
            } elseif (is_array($value)) {
                $this->attributes['coordinates'] = json_encode($value);
            } else {
                $this->attributes['coordinates'] = (string) $value;
            }
            return;
        }

        if ($value instanceof SpatialPoint) {
            $this->attributes['coordinates'] = $value;
        } elseif (is_array($value)) {
            $lat = $value['lat'] ?? $value['latitude'] ?? $value[0] ?? 0;
            $lng = $value['lng'] ?? $value['longitude'] ?? $value[1] ?? 0;
            $this->attributes['coordinates'] = new SpatialPoint((float) $lat, (float) $lng);
        } else {
            $this->attributes['coordinates'] = $value;
        }
    }

    /**
     * Safe coordinate getter across SQLite and MySQL.
     */
    public function getCoordinatesAttribute($value)
    {
        $driver = $this->getConnection()->getDriverName();
        if ($driver === 'sqlite') {
            if (is_string($value) && (str_starts_with($value, '{') || str_starts_with($value, '['))) {
                $decoded = json_decode($value, true);
                if (is_array($decoded)) {
                    $lat = $decoded['lat'] ?? $decoded['latitude'] ?? $decoded[0] ?? 0;
                    $lng = $decoded['lng'] ?? $decoded['longitude'] ?? $decoded[1] ?? 0;
                    return new SpatialPoint((float) $lat, (float) $lng);
                }
            }
            return null;
        }

        try {
            return parent::getCoordinatesAttribute($value);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function getLatitudeAttribute(): float
    {
        $driver = $this->getConnection()->getDriverName();
        if ($driver === 'sqlite') {
            $coords = $this->attributes['coordinates'] ?? null;
            if (is_string($coords) && str_starts_with($coords, '{')) {
                $decoded = json_decode($coords, true);
                return (float) ($decoded['lat'] ?? $decoded['latitude'] ?? 0);
            }
        }

        try {
            return $this->coordinates?->getLat() ?? 0;
        } catch (\Throwable $e) {
            return 0;
        }
    }

    public function getLongitudeAttribute(): float
    {
        $driver = $this->getConnection()->getDriverName();
        if ($driver === 'sqlite') {
            $coords = $this->attributes['coordinates'] ?? null;
            if (is_string($coords) && str_starts_with($coords, '{')) {
                $decoded = json_decode($coords, true);
                return (float) ($decoded['lng'] ?? $decoded['longitude'] ?? 0);
            }
        }

        try {
            return $this->coordinates?->getLng() ?? 0;
        } catch (\Throwable $e) {
            return 0;
        }
    }
}
