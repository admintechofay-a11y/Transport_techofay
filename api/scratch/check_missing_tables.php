<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$existingTables = collect(Illuminate\Support\Facades\DB::select("SELECT name FROM sqlite_master WHERE type='table'"))
    ->pluck('name')
    ->toArray();

echo "Total tables in SQLite: " . count($existingTables) . "\n";

$dirs = [
    __DIR__ . '/../vendor/fleetbase/core-api/migrations',
    __DIR__ . '/../vendor/fleetbase/fleetops-api/server/migrations',
];

$missingTables = [];
foreach ($dirs as $dir) {
    if (!is_dir($dir)) continue;
    $files = scandir($dir);
    foreach ($files as $file) {
        if (!str_ends_with($file, '.php')) continue;
        $content = file_get_contents($dir . '/' . $file);
        if (preg_match("/Schema::create\(['\"]([^'\"]+)['\"]/", $content, $m)) {
            $table = $m[1];
            if (!in_array($table, $existingTables)) {
                $missingTables[$table] = $file;
            }
        }
    }
}

echo "Missing tables from fleetbase migrations (" . count($missingTables) . "):\n";
foreach ($missingTables as $table => $file) {
    echo "- $table (from $file)\n";
}
