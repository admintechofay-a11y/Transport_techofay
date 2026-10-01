<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Fleetbase\FleetOps\Models\Device;

$dev = new Device();
echo "Device fillables:\n";
print_r($dev->getFillable());
