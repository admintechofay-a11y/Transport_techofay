<?php
$files = glob(__DIR__ . '/../vendor/fleetbase/fleetops-api/server/migrations/*.php');
foreach ($files as $f) {
    if (strpos($f, 'create_drivers_table') !== false || strpos($f, 'create_vehicles_table') !== false) {
        echo basename($f) . "\n";
    }
}
