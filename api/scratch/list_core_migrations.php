<?php
$files = glob(__DIR__ . '/../vendor/fleetbase/core-api/migrations/*.php');
foreach ($files as $f) {
    echo basename($f) . "\n";
}
