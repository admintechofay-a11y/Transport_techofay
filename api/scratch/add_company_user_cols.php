<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$companyUserCols = [
    'uuid' => 'VARCHAR(36)',
    '_key' => 'VARCHAR(255)',
];

$existingCompanyUserCols = collect(DB::select("PRAGMA table_info(company_users)"))->pluck('name')->toArray();

foreach ($companyUserCols as $col => $type) {
    if (!in_array($col, $existingCompanyUserCols)) {
        try {
            DB::statement("ALTER TABLE company_users ADD COLUMN {$col} {$type} NULL");
            echo "Added $col to company_users\n";
        } catch (\Throwable $e) {
            echo "Error adding $col to company_users: " . $e->getMessage() . "\n";
        }
    }
}

echo "Done.\n";
