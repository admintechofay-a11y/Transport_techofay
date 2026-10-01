<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            if (!Schema::hasColumn('drivers', 'drivers_license_type')) {
                $table->string('drivers_license_type', 50)->nullable();
            }
            if (!Schema::hasColumn('drivers', 'drivers_license_expiry')) {
                $table->date('drivers_license_expiry')->nullable()->index();
            }
            if (!Schema::hasColumn('drivers', 'address')) {
                $table->string('address', 500)->nullable();
            }
            if (!Schema::hasColumn('drivers', 'alternate_phone')) {
                $table->string('alternate_phone', 50)->nullable();
            }
            if (!Schema::hasColumn('drivers', 'emergency_contact_name')) {
                $table->string('emergency_contact_name', 255)->nullable();
            }
            if (!Schema::hasColumn('drivers', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone', 50)->nullable();
            }
            if (!Schema::hasColumn('drivers', 'emergency_contact_relation')) {
                $table->string('emergency_contact_relation', 100)->nullable();
            }
            if (!Schema::hasColumn('drivers', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable();
            }
            if (!Schema::hasColumn('drivers', 'id_details')) {
                $table->json('id_details')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $columns = [
                'drivers_license_type', 'drivers_license_expiry', 'address', 'alternate_phone',
                'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
                'date_of_birth', 'id_details'
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('drivers', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
