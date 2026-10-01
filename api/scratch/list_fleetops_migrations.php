<?php
$files = glob(__DIR__ . '/../vendor/fleetbase/fleetops-api/migrations/*.php');
foreach ($files as $f) {
    if (strpos($f, 'driver') !== false || strpos($f, 'vehicle') !== false) {
        echo basename($f) . "\n";
    }
}
