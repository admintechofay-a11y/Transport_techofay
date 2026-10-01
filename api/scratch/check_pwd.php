<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Fleetbase\Models\User;
use Illuminate\Support\Facades\Hash;

$u = User::where('email', 'test_1790655566@techofay.com')->first();
echo "User email: " . $u->email . "\n";
echo "Password hash: " . substr($u->password, 0, 20) . "...\n";
echo "Password verify 'Secret1234!': " . (Hash::check('Secret1234!', $u->password) ? 'YES' : 'NO') . "\n";
