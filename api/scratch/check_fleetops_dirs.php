<?php
$dirs = glob(__DIR__ . '/../vendor/fleetbase/fleetops-api/*', GLOB_ONLYDIR);
foreach ($dirs as $d) {
    echo basename($d) . "\n";
}
if (is_dir(__DIR__ . '/../vendor/fleetbase/fleetops-api/server')) {
    echo "--- server/ ---\n";
    foreach (glob(__DIR__ . '/../vendor/fleetbase/fleetops-api/server/*', GLOB_ONLYDIR) as $d) {
        echo basename($d) . "\n";
    }
}
