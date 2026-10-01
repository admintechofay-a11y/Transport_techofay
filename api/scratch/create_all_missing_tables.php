<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "=== CREATING MISSING FLEETBASE TABLES FOR SQLITE ===\n";

// 1. custom_fields
if (!Schema::hasTable('custom_fields')) {
    Schema::create('custom_fields', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('company_uuid')->nullable()->index();
        $table->string('subject_uuid')->nullable()->index();
        $table->string('subject_type')->nullable();
        $table->string('name')->nullable();
        $table->string('label')->nullable();
        $table->string('type')->nullable();
        $table->string('component')->nullable();
        $table->json('options')->nullable();
        $table->boolean('required')->default(false);
        $table->text('default_value')->nullable();
        $table->json('validation_rules')->nullable();
        $table->json('meta')->nullable();
        $table->mediumText('description')->nullable();
        $table->mediumText('help_text')->nullable();
        $table->integer('order')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] custom_fields\n";
} else {
    echo "[EXISTS] custom_fields\n";
}

// 2. custom_field_values
if (!Schema::hasTable('custom_field_values')) {
    Schema::create('custom_field_values', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('company_uuid')->nullable()->index();
        $table->string('custom_field_uuid')->nullable()->index();
        $table->string('subject_uuid')->index();
        $table->string('subject_type')->nullable();
        $table->text('value')->nullable();
        $table->string('value_type')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] custom_field_values\n";
} else {
    echo "[EXISTS] custom_field_values\n";
}

// 3. user_devices
if (!Schema::hasTable('user_devices')) {
    Schema::create('user_devices', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('user_uuid')->nullable()->index();
        $table->string('platform')->nullable();
        $table->string('token')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] user_devices\n";
}

// 4. groups & group_users
if (!Schema::hasTable('groups')) {
    Schema::create('groups', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('company_uuid')->nullable()->index();
        $table->string('name')->nullable();
        $table->string('description')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] groups\n";
}

if (!Schema::hasTable('group_users')) {
    Schema::create('group_users', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('group_uuid')->nullable()->index();
        $table->string('user_uuid')->nullable()->index();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] group_users\n";
}

// 5. categories & types
if (!Schema::hasTable('categories')) {
    Schema::create('categories', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('company_uuid')->nullable()->index();
        $table->string('owner_uuid')->nullable()->index();
        $table->string('owner_type')->nullable();
        $table->string('name')->nullable();
        $table->string('slug')->nullable();
        $table->string('description')->nullable();
        $table->string('for')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] categories\n";
}

if (!Schema::hasTable('types')) {
    Schema::create('types', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('company_uuid')->nullable()->index();
        $table->string('name')->nullable();
        $table->string('slug')->nullable();
        $table->string('for')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] types\n";
}

// 6. api_credentials & api_request_logs
if (!Schema::hasTable('api_credentials')) {
    Schema::create('api_credentials', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('company_uuid')->nullable()->index();
        $table->string('user_uuid')->nullable()->index();
        $table->string('name')->nullable();
        $table->string('key')->nullable()->index();
        $table->string('secret')->nullable();
        $table->string('browser_key')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] api_credentials\n";
}

if (!Schema::hasTable('api_request_logs')) {
    Schema::create('api_request_logs', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('company_uuid')->nullable()->index();
        $table->string('api_credential_uuid')->nullable()->index();
        $table->string('method')->nullable();
        $table->string('path')->nullable();
        $table->integer('status_code')->nullable();
        $table->text('reason')->nullable();
        $table->string('source')->nullable();
        $table->string('ip_address')->nullable();
        $table->float('duration')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] api_request_logs\n";
}

// 7. dashboards & dashboard_widgets & comments
if (!Schema::hasTable('dashboards')) {
    Schema::create('dashboards', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('company_uuid')->nullable()->index();
        $table->string('user_uuid')->nullable()->index();
        $table->string('name')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] dashboards\n";
}

if (!Schema::hasTable('dashboard_widgets')) {
    Schema::create('dashboard_widgets', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('dashboard_uuid')->nullable()->index();
        $table->string('name')->nullable();
        $table->string('component')->nullable();
        $table->json('grid_options')->nullable();
        $table->json('options')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] dashboard_widgets\n";
}

if (!Schema::hasTable('comments')) {
    Schema::create('comments', function (Blueprint $table) {
        $table->increments('id');
        $table->uuid('uuid')->index();
        $table->string('company_uuid')->nullable()->index();
        $table->string('author_uuid')->nullable()->index();
        $table->string('author_type')->nullable();
        $table->string('subject_uuid')->nullable()->index();
        $table->string('subject_type')->nullable();
        $table->text('content')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    echo "[CREATED] comments\n";
}

// 8. FleetOps Maintenance & Assets tables:
$tablesToCreate = [
    'assets' => ['company_uuid', 'name', 'type', 'status', 'description', 'meta'],
    'equipments' => ['company_uuid', 'name', 'type', 'status', 'serial_number', 'meta'],
    'parts' => ['company_uuid', 'name', 'part_number', 'status', 'category_uuid', 'price', 'quantity', 'meta'],
    'work_orders' => ['company_uuid', 'vehicle_uuid', 'assigned_to_uuid', 'status', 'priority', 'type', 'description', 'meta'],
    'maintenances' => ['company_uuid', 'vehicle_uuid', 'status', 'type', 'cost', 'odometer', 'started_at', 'completed_at', 'notes', 'meta'],
    'maintenance_schedules' => ['company_uuid', 'vehicle_uuid', 'name', 'status', 'interval_type', 'interval_value', 'next_due_date', 'next_due_odometer', 'meta'],
    'warranties' => ['company_uuid', 'subject_uuid', 'subject_type', 'provider', 'policy_number', 'expires_at', 'meta'],
    'sensors' => ['company_uuid', 'vehicle_uuid', 'name', 'type', 'status', 'identifier', 'meta'],
    'manifests' => ['company_uuid', 'driver_uuid', 'vehicle_uuid', 'status', 'tracking_number', 'meta'],
    'manifest_stops' => ['company_uuid', 'manifest_uuid', 'place_uuid', 'status', 'order', 'eta', 'meta'],
    'vehicle_devices' => ['company_uuid', 'vehicle_uuid', 'device_uuid', 'status', 'meta'],
    'vehicle_device_events' => ['company_uuid', 'vehicle_uuid', 'device_uuid', 'event_type', 'data', 'meta'],
    'routes' => ['company_uuid', 'name', 'origin_uuid', 'destination_uuid', 'distance', 'time', 'polyline', 'meta'],
    'service_quotes' => ['company_uuid', 'customer_uuid', 'amount', 'currency', 'status', 'meta'],
    'service_quote_items' => ['quote_uuid', 'description', 'amount', 'currency', 'meta'],
    'integrated_vendors' => ['company_uuid', 'provider', 'name', 'status', 'credentials', 'meta'],
];

foreach ($tablesToCreate as $tbl => $cols) {
    if (!Schema::hasTable($tbl)) {
        Schema::create($tbl, function (Blueprint $table) use ($cols) {
            $table->increments('id');
            $table->uuid('uuid')->index();
            $table->string('public_id')->nullable()->index();
            foreach ($cols as $col) {
                if (str_ends_with($col, '_uuid')) {
                    $table->string($col)->nullable()->index();
                } elseif ($col === 'meta' || $col === 'data' || $col === 'credentials') {
                    $table->json($col)->nullable();
                } elseif ($col === 'description' || $col === 'notes' || $col === 'polyline') {
                    $table->text($col)->nullable();
                } else {
                    $table->string($col)->nullable();
                }
            }
            $table->timestamps();
            $table->softDeletes();
        });
        echo "[CREATED] $tbl\n";
    } else {
        echo "[EXISTS] $tbl\n";
    }
}

echo "=== ALL MISSING TABLES CREATED SUCCESSFULLY ===\n";
