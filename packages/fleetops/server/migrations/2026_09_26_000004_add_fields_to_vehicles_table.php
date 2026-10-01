<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            if (!Schema::hasColumn('vehicles', 'owner_name')) {
                $table->string('owner_name', 255)->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'owner_type')) {
                $table->enum('owner_type', ['owner', 'transporter', 'leased'])->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'owner_contact')) {
                $table->string('owner_contact', 50)->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'owner_alternate_contact')) {
                $table->string('owner_alternate_contact', 50)->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'chassis_number')) {
                $table->string('chassis_number', 100)->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'engine_number')) {
                $table->string('engine_number', 100)->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'registration_authority')) {
                $table->string('registration_authority', 255)->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'registration_date')) {
                $table->date('registration_date')->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'manufacturer')) {
                $table->string('manufacturer', 100)->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'vehicle_category')) {
                $table->string('vehicle_category', 100)->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'capacity_tonnes')) {
                $table->decimal('capacity_tonnes', 8, 2)->nullable();
            }
            if (!Schema::hasColumn('vehicles', 'insurance_expiry')) {
                $table->date('insurance_expiry')->nullable()->index();
            }
            if (!Schema::hasColumn('vehicles', 'permit_expiry')) {
                $table->date('permit_expiry')->nullable()->index();
            }
            if (!Schema::hasColumn('vehicles', 'fitness_expiry')) {
                $table->date('fitness_expiry')->nullable()->index();
            }
            if (!Schema::hasColumn('vehicles', 'puc_expiry')) {
                $table->date('puc_expiry')->nullable()->index();
            }
            if (!Schema::hasColumn('vehicles', 'national_permit_expiry')) {
                $table->date('national_permit_expiry')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $columns = [
                'owner_name', 'owner_type', 'owner_contact', 'owner_alternate_contact',
                'chassis_number', 'engine_number', 'registration_authority', 'registration_date',
                'manufacturer', 'vehicle_category', 'capacity_tonnes', 'insurance_expiry',
                'permit_expiry', 'fitness_expiry', 'puc_expiry', 'national_permit_expiry'
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('vehicles', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
