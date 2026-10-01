<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$configs = Fleetbase\FleetOps\Models\OrderConfig::all();
echo "OrderConfigs found: " . $configs->count() . "\n";
foreach ($configs as $cfg) {
    echo "ID: {$cfg->id}, UUID: {$cfg->uuid}, Key: {$cfg->key}, Name: {$cfg->name}\n";
}

if ($configs->isEmpty()) {
    echo "Creating default order config...\n";
    $default = Fleetbase\FleetOps\Models\OrderConfig::defaultOrCreate();
    echo "Created default OrderConfig: {$default->uuid} (Key: {$default->key})\n";
}
