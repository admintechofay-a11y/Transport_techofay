<?php

namespace App\Services;

use App\Models\Position;
use App\Models\Vehicle;
use App\Scopes\CompanyScope;
use Carbon\Carbon;
use Fleetbase\FleetOps\Events\DeviceTelemetryUpdated;
use Fleetbase\FleetOps\Models\Device;
use Fleetbase\LaravelMysqlSpatial\Types\Point as SpatialPoint;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TelemetryService
{
    /**
     * Ingest a single telemetry record and persist it to positions.
     */
    public function ingest(array $data, ?string $companyUuid = null): array
    {
        // 1. Validate coordinates
        if (!isset($data['latitude']) || !isset($data['longitude'])) {
            throw ValidationException::withMessages([
                'coordinates' => ['Both latitude and longitude are required.'],
            ]);
        }

        $lat = (float) $data['latitude'];
        $lng = (float) $data['longitude'];

        if ($lat < -90 || $lat > 90) {
            throw ValidationException::withMessages([
                'latitude' => ['Latitude must be between -90 and 90.'],
            ]);
        }

        if ($lng < -180 || $lng > 180) {
            throw ValidationException::withMessages([
                'longitude' => ['Longitude must be between -180 and 180.'],
            ]);
        }

        // 2. Resolve Device & Vehicle
        $device = $this->resolveDevice($data);
        $vehicle = $this->resolveVehicle($data, $device);

        // 3. Resolve & Enforce Company Isolation
        $resolvedCompany = $companyUuid
            ?: ($device?->company_uuid ?? $vehicle?->company_uuid ?? CompanyScope::resolveCompanyUuid() ?? session('company') ?? request()?->header('X-Company-Uuid'));

        if (!$resolvedCompany) {
            throw ValidationException::withMessages([
                'company' => ['Company context, registered device, or registered vehicle is required.'],
            ]);
        }

        if ($device && $device->company_uuid && $device->company_uuid !== $resolvedCompany) {
            throw new AuthorizationException('Device does not belong to the authenticated company context.');
        }

        if ($vehicle && $vehicle->company_uuid && $vehicle->company_uuid !== $resolvedCompany) {
            throw new AuthorizationException('Vehicle does not belong to the authenticated company context.');
        }

        // 4. Construct coordinates representation
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $coordinates = $isSqlite ? ['lat' => $lat, 'lng' => $lng] : new SpatialPoint($lat, $lng);

        // 5. Persist to positions table
        $timestamp = isset($data['timestamp']) ? Carbon::parse($data['timestamp']) : Carbon::now();
        $positionUuid = (string) Str::uuid();

        $subjectUuid = $vehicle?->uuid ?? $device?->uuid ?? $data['vehicle_uuid'] ?? $data['device_uuid'] ?? null;
        $subjectType = $vehicle ? Vehicle::class : ($device ? Device::class : null);

        $position = Position::create([
            'uuid'         => $positionUuid,
            'company_uuid' => $resolvedCompany,
            'subject_uuid' => $subjectUuid,
            'subject_type' => $subjectType,
            'coordinates'  => $coordinates,
            'heading'      => isset($data['heading']) ? (string) $data['heading'] : (isset($data['bearing']) ? (string) $data['bearing'] : null),
            'bearing'      => isset($data['bearing']) ? (string) $data['bearing'] : (isset($data['heading']) ? (string) $data['heading'] : null),
            'speed'        => isset($data['speed']) ? (string) $data['speed'] : '0',
            'altitude'     => isset($data['altitude']) ? (string) $data['altitude'] : null,
            'created_at'   => $timestamp,
            'updated_at'   => Carbon::now(),
        ]);

        // 6. Update vehicle latest location and telemetry state
        if ($vehicle) {
            $vehicleUpdates = ['updated_at' => Carbon::now()];
            if (isset($data['odometer']) && Schema::hasColumn('vehicles', 'odometer')) {
                $vehicleUpdates['odometer'] = (float) $data['odometer'];
            }

            if ($isSqlite) {
                DB::table('vehicles')->where('uuid', $vehicle->uuid)->update($vehicleUpdates);
            } else {
                if (Schema::hasColumn('vehicles', 'location')) {
                    $vehicle->location = $coordinates;
                }
                if (isset($vehicleUpdates['odometer'])) {
                    $vehicle->odometer = $vehicleUpdates['odometer'];
                }
                $vehicle->save();
            }
        }

        // 7. Update device latest location and dispatch event
        if ($device) {
            $meta = is_array($device->meta) ? $device->meta : (json_decode($device->meta ?? '{}', true) ?: []);
            $meta['telemetry'] = [
                'latitude'  => $lat,
                'longitude' => $lng,
                'speed'     => (float) ($data['speed'] ?? 0),
                'heading'   => $data['heading'] ?? $data['bearing'] ?? null,
                'timestamp' => $timestamp->toISOString(),
            ];

            if ($isSqlite) {
                $deviceUpdates = [
                    'meta'       => json_encode($meta),
                    'updated_at' => Carbon::now(),
                ];
                DB::table('devices')->where('uuid', $device->uuid)->update($deviceUpdates);
            } else {
                if (Schema::hasColumn('devices', 'location')) {
                    $device->location = $coordinates;
                }
                $device->meta = $meta;
                $device->save();
            }

            try {
                if (class_exists(DeviceTelemetryUpdated::class)) {
                    event(new DeviceTelemetryUpdated($device));
                }
            } catch (\Throwable $e) {
                // Ignore broadcast transport errors in offline or unit test environments
            }
        }

        return [
            'success'       => true,
            'position_uuid' => $position->uuid,
            'company_uuid'  => $resolvedCompany,
            'vehicle_uuid'  => $vehicle?->uuid,
            'device_uuid'   => $device?->uuid,
            'latitude'      => $lat,
            'longitude'     => $lng,
            'speed'         => (float) ($data['speed'] ?? 0),
            'heading'       => isset($data['heading']) ? (float) $data['heading'] : null,
            'timestamp'     => $timestamp->toISOString(),
        ];
    }

    /**
     * Ingest batch of telemetry records.
     */
    public function batchIngest(array $records, ?string $companyUuid = null): array
    {
        $results = [];
        foreach ($records as $record) {
            $results[] = $this->ingest($record, $companyUuid);
        }

        return [
            'success' => true,
            'count'   => count($results),
            'items'   => $results,
        ];
    }

    /**
     * Resolve Device from telemetry input data.
     */
    protected function resolveDevice(array $data): ?Device
    {
        if (!Schema::hasTable('devices')) {
            return null;
        }

        $ident = $data['device_token'] ?? $data['device_id'] ?? $data['device_uuid'] ?? $data['imei'] ?? $data['serial_number'] ?? null;
        if (!$ident) {
            return null;
        }

        return Device::where('uuid', $ident)
            ->orWhere('public_id', $ident)
            ->orWhere('serial_number', $ident)
            ->orWhere('imei', $ident)
            ->first();
    }

    /**
     * Resolve Vehicle from telemetry input data or associated device.
     */
    protected function resolveVehicle(array $data, ?Device $device = null): ?Vehicle
    {
        if (!Schema::hasTable('vehicles')) {
            return null;
        }

        $vehicleIdent = $data['vehicle_uuid'] ?? $data['vehicle_id'] ?? $data['plate_number'] ?? null;

        if ($vehicleIdent) {
            return Vehicle::withoutGlobalScopes()
                ->where('uuid', $vehicleIdent)
                ->orWhere('public_id', $vehicleIdent)
                ->orWhere('plate_number', $vehicleIdent)
                ->first();
        }

        if ($device && !empty($device->vehicle_uuid)) {
            return Vehicle::withoutGlobalScopes()->where('uuid', $device->vehicle_uuid)->first();
        }

        return null;
    }
}
