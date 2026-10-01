<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (!Schema::hasTable('webhook_endpoints')) {
    Schema::create('webhook_endpoints', function (Blueprint $table) {
        $table->increments('id');
        $table->string('_key')->nullable();
        $table->string('uuid', 191)->nullable()->index();
        $table->string('company_uuid', 191)->nullable()->index();
        $table->char('updated_by_uuid', 36)->nullable();
        $table->char('created_by_uuid', 36)->nullable();
        $table->string('api_credential_uuid', 191)->nullable();
        $table->string('url')->nullable();
        $table->string('mode')->nullable();
        $table->string('version')->nullable();
        $table->string('description')->nullable();
        $table->text('events')->nullable();
        $table->string('status')->nullable();
        $table->softDeletes();
        $table->timestamp('created_at')->nullable()->index();
        $table->timestamp('updated_at')->nullable();
        $table->unique(['uuid']);
    });
    echo "Created webhook_endpoints table.\n";
} else {
    echo "webhook_endpoints table exists.\n";
}

if (!Schema::hasTable('api_events')) {
    Schema::create('api_events', function (Blueprint $table) {
        $table->increments('id');
        $table->string('_key')->nullable();
        $table->string('uuid', 191)->nullable()->index();
        $table->string('public_id', 191)->nullable()->unique();
        $table->string('company_uuid', 191)->nullable()->index();
        $table->string('api_credential_uuid')->nullable();
        $table->string('event', 191)->nullable();
        $table->string('source')->nullable();
        $table->text('data')->nullable();
        $table->string('description')->nullable();
        $table->string('method', 191)->nullable();
        $table->softDeletes();
        $table->timestamps();
        $table->unique(['uuid']);
    });
    echo "Created api_events table.\n";
} else {
    echo "api_events table exists.\n";
}

if (!Schema::hasTable('webhook_request_logs')) {
    Schema::create('webhook_request_logs', function (Blueprint $table) {
        $table->increments('id');
        $table->string('_key')->nullable();
        $table->string('uuid', 191)->nullable()->index();
        $table->string('company_uuid', 191)->nullable()->index();
        $table->string('webhook_endpoint_uuid', 191)->nullable()->index();
        $table->string('api_event_uuid', 191)->nullable()->index();
        $table->integer('status_code')->nullable();
        $table->string('reason_phrase')->nullable();
        $table->string('duration')->nullable();
        $table->string('attempt')->nullable();
        $table->text('response')->nullable();
        $table->string('status')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "Created webhook_request_logs table.\n";
} else {
    echo "webhook_request_logs table exists.\n";
}
