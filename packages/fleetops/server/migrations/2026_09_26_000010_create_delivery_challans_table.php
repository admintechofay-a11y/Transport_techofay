<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('delivery_challans')) {
            Schema::create('delivery_challans', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->nullable()->index();
                $table->string('load_uuid', 191)->nullable()->index();
                $table->string('load_location_uuid', 191)->nullable()->index();
                $table->string('vehicle_uuid', 191)->nullable()->index();
                $table->string('driver_uuid', 191)->nullable()->index();
                $table->string('consignee_uuid', 191)->nullable()->index();
                $table->string('challan_number', 100)->unique();
                $table->date('challan_date')->nullable();
                $table->json('material_items')->nullable();
                $table->decimal('total_quantity', 10, 2)->nullable();
                $table->decimal('total_weight', 10, 2)->nullable();
                $table->enum('status', ['pending', 'delivered', 'partial', 'returned'])->default('pending');
                $table->timestamp('delivered_at')->nullable();
                $table->string('received_by', 255)->nullable();
                $table->text('remarks')->nullable();
                $table->softDeletes();
                $table->timestamps();

                $table->index(['company_uuid', 'status']);
                $table->index(['company_uuid', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_challans');
    }
};
