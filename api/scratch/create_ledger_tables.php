<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (!Schema::hasTable('ledger_accounts')) {
    Schema::create('ledger_accounts', function (Blueprint $table) {
        $table->increments('id');
        $table->string('uuid', 191)->nullable()->index();
        $table->string('company_uuid', 191)->nullable()->index();
        $table->string('code')->nullable();
        $table->string('name')->nullable();
        $table->string('type')->nullable();
        $table->string('currency')->default('INR');
        $table->bigInteger('balance')->default(0);
        $table->string('status')->default('active');
        $table->timestamps();
        $table->softDeletes();
    });
    echo "Created ledger_accounts table.\n";
}

if (!Schema::hasTable('ledger_wallets')) {
    Schema::create('ledger_wallets', function (Blueprint $table) {
        $table->increments('id');
        $table->string('uuid', 191)->nullable()->index();
        $table->string('company_uuid', 191)->nullable()->index();
        $table->string('subject_uuid', 191)->nullable()->index();
        $table->string('subject_type')->nullable();
        $table->string('name')->nullable();
        $table->string('currency')->default('INR');
        $table->bigInteger('balance')->default(0);
        $table->string('status')->default('active');
        $table->timestamps();
        $table->softDeletes();
    });
    echo "Created ledger_wallets table.\n";
}
