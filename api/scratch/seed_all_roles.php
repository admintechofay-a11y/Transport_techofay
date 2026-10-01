<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Permission\Models\Role;
use Fleetbase\Models\Company;
use Illuminate\Support\Str;

$company = Company::first();
$companyUuid = $company ? $company->uuid : 'company_techofay_01';

$roles = [
    'Driver',
    'driver',
    'Administrator',
    'admin',
    'Dispatcher',
    'dispatcher',
    'Operations Manager',
    'Fleet-Ops Contact',
    'Fleet-Ops Customer',
];

$guards = ['sanctum', 'web', 'api'];

echo "=== SEEDING ROLES FOR SPATIE PERMISSIONS ===\n";
foreach ($roles as $roleName) {
    foreach ($guards as $guard) {
        $existing = Role::where('name', $roleName)
            ->where('guard_name', $guard)
            ->first();
        if (!$existing) {
            Role::create([
                'name' => $roleName,
                'guard_name' => $guard,
                'company_uuid' => $companyUuid,
            ]);
            echo "[CREATED] Role '$roleName' for guard '$guard'\n";
        } else {
            echo "[EXISTS] Role '$roleName' for guard '$guard'\n";
        }
    }
}
echo "=== ROLES COMPLETE ===\n";
