<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cols = Illuminate\Support\Facades\DB::select("PRAGMA table_info(roles)");
foreach ($cols as $c) {
    echo $c->cid . ": " . $c->name . " (" . $c->type . ") pk=" . $c->pk . "\n";
}

$roles = Illuminate\Support\Facades\DB::select("SELECT id, name, guard_name FROM roles");
echo "\nRows in roles table:\n";
foreach ($roles as $r) {
    echo "ID: " . var_export($r->id, true) . ", Name: " . $r->name . ", Guard: " . $r->guard_name . "\n";
}
