<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Has devices table? " . (Schema::hasTable('devices') ? 'YES' : 'NO') . "\n";
if (Schema::hasTable('devices')) {
    $columns = DB::select("PRAGMA table_info(devices)");
    foreach ($columns as $c) {
        echo "  - {$c->name} ({$c->type})\n";
    }
}
