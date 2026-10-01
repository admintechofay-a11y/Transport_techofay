<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\Vehicle;

$d = new Driver();
echo "Driver fillables:\n";
print_r($d->getFillable());

$v = new Vehicle();
echo "Vehicle fillables:\n";
print_r($v->getFillable());
