<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('bilties')) {
            Schema::create('bilties', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->nullable()->index();
                $table->string('lr_uuid', 191)->nullable()->index();
                $table->string('load_uuid', 191)->nullable()->index();       // orders table
                $table->string('vehicle_uuid', 191)->nullable()->index();
                $table->string('driver_uuid', 191)->nullable()->index();
                $table->string('customer_uuid', 191)->nullable()->index();
                $table->string('consignor_uuid', 191)->nullable()->index();
                $table->string('consignee_uuid', 191)->nullable()->index();
                $table->string('bilty_number', 100)->unique();
                $table->date('bilty_date')->nullable();
                $table->string('from_location', 500)->nullable();
                $table->string('to_location', 500)->nullable();
                $table->json('material_details')->nullable(); // [{material, quantity, unit, weight}]
                $table->decimal('total_weight', 10, 2)->nullable();
                $table->decimal('freight_amount', 12, 2)->default(0);
                $table->decimal('advance_amount', 12, 2)->default(0);
                $table->decimal('balance_amount', 12, 2)->default(0); // computed: freight - advance
                $table->enum('payment_terms', ['paid', 'to_pay', 'to_be_billed'])->default('to_pay');
                $table->text('remarks')->nullable();
                $table->string('authorized_by', 255)->nullable();
                $table->json('meta')->nullable();
                $table->string('created_by_uuid', 191)->nullable();
                $table->softDeletes();
                $table->timestamps();

                $table->index(['company_uuid', 'payment_terms']);
                $table->index(['company_uuid', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bilties');
    }
};
