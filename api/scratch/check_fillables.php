<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Fleetbase\Models\Company;
use Fleetbase\Models\CompanyUser;

$company = new Company();
echo "Company fillable:\n";
print_r($company->getFillable());

$cu = new CompanyUser();
echo "CompanyUser fillable:\n";
print_r($cu->getFillable());
