<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// 1. Fix DRIVERS columns
$driverColumns = [
    'vehicle_uuid' => 'VARCHAR(36)',
    'vendor_uuid' => 'VARCHAR(36)',
    'vendor_type' => 'VARCHAR(255)',
    'current_job_uuid' => 'VARCHAR(36)',
    'auth_token' => 'VARCHAR(255)',
    'signup_token_used' => 'VARCHAR(255)',
    'location' => 'TEXT',
    'latitude' => 'VARCHAR(255)',
    'longitude' => 'VARCHAR(255)',
    'heading' => 'VARCHAR(255)',
    'bearing' => 'VARCHAR(255)',
    'speed' => 'VARCHAR(255)',
    'altitude' => 'VARCHAR(255)',
    'country' => 'VARCHAR(255)',
    'city' => 'VARCHAR(255)',
    'currency' => 'VARCHAR(255)',
    'online' => 'INTEGER DEFAULT 0',
    'current_status' => 'VARCHAR(255)',
    'meta' => 'TEXT',
    'skills' => 'TEXT',
    'max_travel_time' => 'VARCHAR(255)',
    'max_distance' => 'VARCHAR(255)',
    'time_window_start' => 'VARCHAR(255)',
    'time_window_end' => 'VARCHAR(255)',
];

$existingDriverCols = collect(DB::select("PRAGMA table_info(drivers)"))->pluck('name')->toArray();

foreach ($driverColumns as $col => $type) {
    if (!in_array($col, $existingDriverCols)) {
        try {
            DB::statement("ALTER TABLE drivers ADD COLUMN {$col} {$type} NULL");
            echo "Added $col to drivers\n";
        } catch (\Throwable $e) {
            echo "Error adding $col to drivers: " . $e->getMessage() . "\n";
        }
    }
}

// 2. Fix VEHICLES columns
$vehicleColumns = [
    'vendor_uuid' => 'VARCHAR(36)',
    'photo_uuid' => 'VARCHAR(36)',
    'category_uuid' => 'VARCHAR(36)',
    'warranty_uuid' => 'VARCHAR(36)',
    'vin' => 'VARCHAR(255)',
    'vin_data' => 'TEXT',
    'meta' => 'TEXT',
    'telematics' => 'TEXT',
    'model_data' => 'TEXT',
    'details' => 'TEXT',
    'specs' => 'TEXT',
    'notes' => 'TEXT',
    'location' => 'TEXT',
    'latitude' => 'VARCHAR(255)',
    'longitude' => 'VARCHAR(255)',
    'heading' => 'VARCHAR(255)',
    'speed' => 'VARCHAR(255)',
    'altitude' => 'VARCHAR(255)',
    'odometer' => 'VARCHAR(255)',
    'odometer_unit' => 'VARCHAR(255)',
    'odometer_at_purchase' => 'VARCHAR(255)',
    'measurement_system' => 'VARCHAR(255)',
    'fuel_type' => 'VARCHAR(255)',
    'fuel_volume_unit' => 'VARCHAR(255)',
    'fuel_card_number' => 'VARCHAR(255)',
    'transmission' => 'VARCHAR(255)',
    'body_type' => 'VARCHAR(255)',
    'body_sub_type' => 'VARCHAR(255)',
    'usage_type' => 'VARCHAR(255)',
    'ownership_type' => 'VARCHAR(255)',
    'type' => 'VARCHAR(255)',
    'class' => 'VARCHAR(255)',
    'call_sign' => 'VARCHAR(255)',
    'serial_number' => 'VARCHAR(255)',
    'financing_status' => 'VARCHAR(255)',
    'cargo_volume' => 'VARCHAR(255)',
    'weight' => 'VARCHAR(255)',
    'payload_capacity' => 'VARCHAR(255)',
    'online' => 'INTEGER DEFAULT 0',
    'purchased_at' => 'DATETIME',
    'lease_expires_at' => 'DATETIME',
    'currency' => 'VARCHAR(255)',
    'insurance_value' => 'VARCHAR(255)',
    'current_value' => 'VARCHAR(255)',
    'acquisition_cost' => 'VARCHAR(255)',
    'skills' => 'TEXT',
    'max_tasks' => 'INTEGER',
    'time_window_start' => 'VARCHAR(255)',
    'time_window_end' => 'VARCHAR(255)',
    'return_to_depot' => 'INTEGER DEFAULT 1',
];

$existingVehicleCols = collect(DB::select("PRAGMA table_info(vehicles)"))->pluck('name')->toArray();

foreach ($vehicleColumns as $col => $type) {
    if (!in_array($col, $existingVehicleCols)) {
        try {
            DB::statement("ALTER TABLE vehicles ADD COLUMN {$col} {$type} NULL");
            echo "Added $col to vehicles\n";
        } catch (\Throwable $e) {
            echo "Error adding $col to vehicles: " . $e->getMessage() . "\n";
        }
    }
}

echo "Schema sync for drivers and vehicles completed.\n";
