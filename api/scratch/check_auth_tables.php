<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

foreach (['companies', 'users', 'company_users', 'roles', 'permissions'] as $table) {
    echo "=== Table: $table ===\n";
    $columns = DB::select("PRAGMA table_info($table)");
    foreach ($columns as $c) {
        echo "  - {$c->name} ({$c->type})\n";
    }
}
