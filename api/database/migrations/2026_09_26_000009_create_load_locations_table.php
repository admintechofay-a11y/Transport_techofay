<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('load_locations')) {
            Schema::create('load_locations', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->nullable()->index();
                $table->string('load_uuid', 191)->nullable()->index();       // orders table
                $table->string('place_uuid', 191)->nullable()->index();      // places table
                $table->integer('sequence')->default(0);
                $table->enum('location_type', ['pickup', 'delivery'])->default('pickup');
                $table->string('contact_name', 255)->nullable();
                $table->string('contact_phone', 50)->nullable();
                $table->json('material_items')->nullable(); // [{material, quantity, unit, weight, remarks}]
                $table->decimal('total_quantity', 10, 2)->nullable();
                $table->decimal('total_weight', 10, 2)->nullable();
                $table->enum('status', ['pending', 'loading', 'loaded', 'in_transit', 'delivered', 'skipped'])
                      ->default('pending');
                $table->timestamp('completed_at')->nullable();
                $table->string('completed_by_uuid', 191)->nullable();
                $table->text('remarks')->nullable();
                $table->softDeletes();
                $table->timestamps();

                $table->index(['load_uuid', 'sequence']);
                $table->index(['company_uuid', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('load_locations');
    }
};
