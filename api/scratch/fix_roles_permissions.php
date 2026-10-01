<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;

// 1. Roles columns: company_uuid, description, deleted_at
$roleCols = ['company_uuid' => 'VARCHAR(36)', 'description' => 'VARCHAR(255)', 'deleted_at' => 'DATETIME'];
$existingRoleCols = collect(DB::select("PRAGMA table_info(roles)"))->pluck('name')->toArray();
foreach ($roleCols as $col => $type) {
    if (!in_array($col, $existingRoleCols)) {
        DB::statement("ALTER TABLE roles ADD COLUMN {$col} {$type} NULL");
        echo "Added $col to roles\n";
    }
}

// 2. Permissions columns: company_uuid, description, deleted_at
$permCols = ['company_uuid' => 'VARCHAR(36)', 'description' => 'VARCHAR(255)', 'deleted_at' => 'DATETIME'];
$existingPermCols = collect(DB::select("PRAGMA table_info(permissions)"))->pluck('name')->toArray();
foreach ($permCols as $col => $type) {
    if (!in_array($col, $existingPermCols)) {
        DB::statement("ALTER TABLE permissions ADD COLUMN {$col} {$type} NULL");
        echo "Added $col to permissions\n";
    }
}

// 3. model_has_roles
if (!Schema::hasTable('model_has_roles')) {
    Schema::create('model_has_roles', function (Blueprint $table) {
        $table->uuid('role_id')->index();
        $table->string('model_type');
        $table->uuid('model_uuid')->index();
        $table->primary(['role_id', 'model_uuid', 'model_type']);
    });
    echo "Created model_has_roles\n";
} else {
    echo "model_has_roles exists\n";
}

// 4. model_has_permissions
if (!Schema::hasTable('model_has_permissions')) {
    Schema::create('model_has_permissions', function (Blueprint $table) {
        $table->uuid('permission_id')->index();
        $table->string('model_type');
        $table->uuid('model_uuid')->index();
        $table->primary(['permission_id', 'model_uuid', 'model_type']);
    });
    echo "Created model_has_permissions\n";
} else {
    echo "model_has_permissions exists\n";
}

// 5. role_has_permissions
if (!Schema::hasTable('role_has_permissions')) {
    Schema::create('role_has_permissions', function (Blueprint $table) {
        $table->uuid('permission_id')->index();
        $table->uuid('role_id')->index();
        $table->primary(['permission_id', 'role_id']);
    });
    echo "Created role_has_permissions\n";
} else {
    echo "role_has_permissions exists\n";
}

// 6. Ensure Administrator role exists
$adminRole = DB::table('roles')->where('name', 'Administrator')->where('guard_name', 'sanctum')->first();
if (!$adminRole) {
    DB::table('roles')->insert([
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'name' => 'Administrator',
        'guard_name' => 'sanctum',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "Created default Administrator role\n";
} else {
    echo "Administrator role exists\n";
}

echo "Done updating roles and permissions tables.\n";
