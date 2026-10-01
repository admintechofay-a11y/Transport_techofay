<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

$companyCols = [
    'public_id' => 'string',
    'slug' => 'string',
    'owner_uuid' => 'string',
    'logo_uuid' => 'string',
    'backdrop_uuid' => 'string',
    'place_uuid' => 'string',
    'website_url' => 'string',
    'description' => 'text',
    'email' => 'string',
    'phone' => 'string',
    'currency' => 'string',
    'country' => 'string',
    'timezone' => 'string',
    'type' => 'string',
    'status' => 'string',
    'plan' => 'string',
    'options' => 'text',
    'meta' => 'text',
    'stripe_customer_id' => 'string',
    'stripe_connect_id' => 'string',
    'trial_ends_at' => 'datetime',
    'onboarding_completed_at' => 'datetime',
    'onboarding_completed_by_uuid' => 'string',
];

$existingCompanyCols = collect(DB::select("PRAGMA table_info(companies)"))->pluck('name')->toArray();

foreach ($companyCols as $col => $type) {
    if (!in_array($col, $existingCompanyCols)) {
        try {
            DB::statement("ALTER TABLE companies ADD COLUMN {$col} {$type} NULL");
            echo "Added $col to companies\n";
        } catch (\Throwable $e) {
            echo "Error adding $col to companies: " . $e->getMessage() . "\n";
        }
    }
}

$companyUserCols = [
    'status' => 'string',
    'external' => 'boolean',
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

echo "Column updates complete.\n";
