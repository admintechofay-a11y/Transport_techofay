<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = Illuminate\Support\Facades\DB::select("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
$tableNames = array_map(function($t) { return $t->name; }, $tables);
echo "Custom field tables:\n";
$found = false;
foreach ($tableNames as $name) {
    if (strpos($name, 'custom') !== false || strpos($name, 'field') !== false) {
        echo "- $name\n";
        $found = true;
    }
}
if (!$found) echo "NONE FOUND\n";
