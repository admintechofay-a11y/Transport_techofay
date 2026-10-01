<?php

namespace App\Services;

use App\Models\DriverDocument;
use App\Models\VehicleDocument;
use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\Order;
use Fleetbase\FleetOps\Models\Vehicle;
use Illuminate\Validation\ValidationException;

class DispatchValidationService
{
    public const MANDATORY_VEHICLE_DOCS = ['rc', 'insurance', 'fitness_certificate'];
    public const MANDATORY_DRIVER_DOCS  = ['driving_licence'];

    /**
     * Validate whether a vehicle can be assigned and dispatched.
     *
     * @throws ValidationException
     */
    public function validateVehicleForDispatch(Vehicle $vehicle): bool
    {
        // Rule 1: Vehicle status must be active or available
        $status = strtolower($vehicle->status ?? 'active');
        if (in_array($status, ['inactive', 'maintenance', 'decommissioned', 'disabled', 'retired'])) {
            throw ValidationException::withMessages([
                'vehicle' => ["Vehicle {$vehicle->plate_number} is inactive or under maintenance and cannot be dispatched."],
            ]);
        }

        // Rule 2: Cannot be already assigned to an overlapping active trip
        $activeTripExists = Order::withoutGlobalScopes()
            ->where('vehicle_assigned_uuid', $vehicle->uuid)
            ->whereNotIn('status', ['completed', 'canceled', 'declined'])
            ->exists();

        if ($activeTripExists) {
            throw ValidationException::withMessages([
                'vehicle' => ["Vehicle {$vehicle->plate_number} is already assigned to an overlapping active trip."],
            ]);
        }

        // Rule 3: Mandatory documents cannot be missing or expired
        foreach (self::MANDATORY_VEHICLE_DOCS as $docType) {
            $doc = VehicleDocument::withoutGlobalScopes()
                ->where('vehicle_uuid', $vehicle->uuid)
                ->where('document_type', $docType)
                ->where('is_active', true)
                ->latest()
                ->first();

            if (!$doc) {
                throw ValidationException::withMessages([
                    'vehicle' => ["Mandatory vehicle document '{$docType}' is missing for {$vehicle->plate_number}."],
                ]);
            }

            if ($doc->expiry_date && $doc->expiry_date->isPast()) {
                $formattedDate = $doc->expiry_date instanceof \Carbon\Carbon ? $doc->expiry_date->format('Y-m-d') : (string) $doc->expiry_date;
                throw ValidationException::withMessages([
                    'vehicle' => ["Mandatory vehicle document '{$docType}' is expired (expired on {$formattedDate}) for {$vehicle->plate_number}."],
                ]);
            }
        }

        return true;
    }

    /**
     * Validate whether a driver can be assigned and dispatched.
     *
     * @throws ValidationException
     */
    public function validateDriverForDispatch(Driver $driver): bool
    {
        // Rule 1: Driver status must be active or available
        $status = strtolower($driver->status ?? 'active');
        if (in_array($status, ['inactive', 'suspended', 'on_leave', 'terminated', 'off_duty'])) {
            throw ValidationException::withMessages([
                'driver' => ["Driver {$driver->name} is inactive or off-duty and cannot be dispatched."],
            ]);
        }

        // Rule 2: Cannot be already assigned to an overlapping active trip
        $activeTripExists = Order::withoutGlobalScopes()
            ->where('driver_assigned_uuid', $driver->uuid)
            ->whereNotIn('status', ['completed', 'canceled', 'declined'])
            ->exists();

        if ($activeTripExists) {
            throw ValidationException::withMessages([
                'driver' => ["Driver {$driver->name} is already assigned to an overlapping active trip."],
            ]);
        }

        // Rule 3: Mandatory documents cannot be missing or expired
        foreach (self::MANDATORY_DRIVER_DOCS as $docType) {
            $doc = DriverDocument::withoutGlobalScopes()
                ->where('driver_uuid', $driver->uuid)
                ->where('document_type', $docType)
                ->where('is_active', true)
                ->latest()
                ->first();

            if (!$doc) {
                if (empty($driver->drivers_license_number)) {
                    throw ValidationException::withMessages([
                        'driver' => ["Mandatory driver document '{$docType}' is missing for {$driver->name}."],
                    ]);
                }
                if ($driver->license_expiry && $driver->license_expiry->isPast()) {
                    throw ValidationException::withMessages([
                        'driver' => ["Driver license for {$driver->name} is expired."],
                    ]);
                }
            } else {
                if ($doc->expiry_date && $doc->expiry_date->isPast()) {
                    throw ValidationException::withMessages([
                        'driver' => ["Mandatory driver document '{$docType}' expired on {$doc->expiry_date->format('Y-m-d')} for {$driver->name}."],
                    ]);
                }
            }
        }

        return true;
    }
}
