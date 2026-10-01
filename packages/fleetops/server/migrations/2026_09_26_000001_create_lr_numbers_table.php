<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('lr_numbers')) {
            Schema::create('lr_numbers', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->nullable()->index();
                $table->string('load_uuid', 191)->nullable()->index();       // links to orders table
                $table->string('vehicle_uuid', 191)->nullable()->index();
                $table->string('driver_uuid', 191)->nullable()->index();
                $table->string('customer_uuid', 191)->nullable()->index();   // links to contacts table
                $table->string('consignor_uuid', 191)->nullable()->index();
                $table->string('consignee_uuid', 191)->nullable()->index();
                $table->string('bilty_uuid', 191)->nullable()->index();
                $table->string('lr_number', 100)->unique();
                $table->enum('generation_mode', ['auto', 'manual'])->default('auto');
                $table->enum('status', [
                    'draft', 'generated', 'loaded', 'in_transit',
                    'partially_delivered', 'delivered', 'cancelled'
                ])->default('draft');
                $table->string('from_location', 500)->nullable();
                $table->string('to_location', 500)->nullable();
                $table->date('lr_date')->nullable();
                $table->text('remarks')->nullable();
                $table->json('meta')->nullable();
                $table->string('created_by_uuid', 191)->nullable();
                $table->string('updated_by_uuid', 191)->nullable();
                $table->softDeletes();
                $table->timestamps();

                $table->index(['company_uuid', 'status']);
                $table->index(['company_uuid', 'created_at']);
            });
        } else {
            Schema::table('lr_numbers', function (Blueprint $table) {
                if (!Schema::hasColumn('lr_numbers', 'load_uuid')) $table->string('load_uuid', 191)->nullable()->index();
                if (!Schema::hasColumn('lr_numbers', 'vehicle_uuid')) $table->string('vehicle_uuid', 191)->nullable()->index();
                if (!Schema::hasColumn('lr_numbers', 'driver_uuid')) $table->string('driver_uuid', 191)->nullable()->index();
                if (!Schema::hasColumn('lr_numbers', 'customer_uuid')) $table->string('customer_uuid', 191)->nullable()->index();
                if (!Schema::hasColumn('lr_numbers', 'consignor_uuid')) $table->string('consignor_uuid', 191)->nullable()->index();
                if (!Schema::hasColumn('lr_numbers', 'consignee_uuid')) $table->string('consignee_uuid', 191)->nullable()->index();
                if (!Schema::hasColumn('lr_numbers', 'bilty_uuid')) $table->string('bilty_uuid', 191)->nullable()->index();
                if (!Schema::hasColumn('lr_numbers', 'generation_mode')) $table->string('generation_mode', 20)->default('auto');
                if (!Schema::hasColumn('lr_numbers', 'status')) $table->string('status', 50)->default('draft');
                if (!Schema::hasColumn('lr_numbers', 'lr_date')) $table->date('lr_date')->nullable();
                if (!Schema::hasColumn('lr_numbers', 'remarks')) $table->text('remarks')->nullable();
                if (!Schema::hasColumn('lr_numbers', 'meta')) $table->json('meta')->nullable();
                if (!Schema::hasColumn('lr_numbers', 'created_by_uuid')) $table->string('created_by_uuid', 191)->nullable();
                if (!Schema::hasColumn('lr_numbers', 'updated_by_uuid')) $table->string('updated_by_uuid', 191)->nullable();
            });
        }

        if (!Schema::hasTable('lr_status_histories')) {
            Schema::create('lr_status_histories', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->nullable()->index();
                $table->string('lr_uuid', 191)->index();
                $table->string('from_status', 50)->nullable();
                $table->string('to_status', 50);
                $table->text('remarks')->nullable();
                $table->string('changed_by_uuid', 191)->nullable();
                $table->json('meta')->nullable();
                $table->softDeletes();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lr_status_histories');
        Schema::dropIfExists('lr_numbers');
    }
};
