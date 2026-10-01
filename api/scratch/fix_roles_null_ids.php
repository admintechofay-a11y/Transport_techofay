<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

$roles = DB::select("SELECT rowid, name, guard_name, id FROM roles WHERE id IS NULL OR id = ''");
echo "Found " . count($roles) . " roles with NULL id. Updating...\n";
foreach ($roles as $r) {
    $uuid = (string) Str::uuid();
    DB::update("UPDATE roles SET id = ? WHERE rowid = ?", [$uuid, $r->rowid]);
    echo "Assigned UUID $uuid to {$r->name} ({$r->guard_name})\n";
}

echo "=== ROLES ID FIX COMPLETE ===\n";
