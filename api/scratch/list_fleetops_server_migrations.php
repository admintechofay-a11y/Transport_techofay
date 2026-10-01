<?php
$files = glob(__DIR__ . '/../vendor/fleetbase/fleetops-api/server/migrations/*.php');
foreach ($files as $f) {
    echo basename($f) . "\n";
}
