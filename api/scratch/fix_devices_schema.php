<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$deviceCols = [
    'attachable_uuid' => 'VARCHAR(36)',
    'attachable_type' => 'VARCHAR(255)',
    'telematic_uuid' => 'VARCHAR(36)',
    'warranty_uuid' => 'VARCHAR(36)',
    'photo_uuid' => 'VARCHAR(36)',
    'type' => 'VARCHAR(255)',
    'device_id' => 'VARCHAR(255)',
    'internal_id' => 'VARCHAR(255)',
    'imsi' => 'VARCHAR(255)',
    'firmware_version' => 'VARCHAR(255)',
    'provider' => 'VARCHAR(255)',
    'name' => 'VARCHAR(255)',
    'model' => 'VARCHAR(255)',
    'manufacturer' => 'VARCHAR(255)',
    'last_position' => 'TEXT',
    'installation_date' => 'DATETIME',
    'last_maintenance_date' => 'DATETIME',
    'data' => 'TEXT',
    'options' => 'TEXT',
    'online' => 'INTEGER DEFAULT 0',
    'status' => 'VARCHAR(255)',
    'data_frequency' => 'VARCHAR(255)',
    'notes' => 'TEXT',
    'last_online_at' => 'DATETIME',
    'slug' => 'VARCHAR(255)',
];

$existingDeviceCols = collect(DB::select("PRAGMA table_info(devices)"))->pluck('name')->toArray();

foreach ($deviceCols as $col => $type) {
    if (!in_array($col, $existingDeviceCols)) {
        try {
            DB::statement("ALTER TABLE devices ADD COLUMN {$col} {$type} NULL");
            echo "Added $col to devices\n";
        } catch (\Throwable $e) {
            echo "Error adding $col to devices: " . $e->getMessage() . "\n";
        }
    }
}

echo "Devices schema updated.\n";
