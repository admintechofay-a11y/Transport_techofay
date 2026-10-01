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
        } else {
            Schema::table('bilties', function (Blueprint $table) {
                if (!Schema::hasColumn('bilties', 'lr_uuid')) $table->string('lr_uuid', 191)->nullable()->index();
                if (!Schema::hasColumn('bilties', 'load_uuid')) $table->string('load_uuid', 191)->nullable()->index();
                if (!Schema::hasColumn('bilties', 'from_location')) $table->string('from_location', 500)->nullable();
                if (!Schema::hasColumn('bilties', 'to_location')) $table->string('to_location', 500)->nullable();
                if (!Schema::hasColumn('bilties', 'material_details')) $table->json('material_details')->nullable();
                if (!Schema::hasColumn('bilties', 'total_weight')) $table->decimal('total_weight', 10, 2)->nullable();
                if (!Schema::hasColumn('bilties', 'freight_amount')) $table->decimal('freight_amount', 12, 2)->default(0);
                if (!Schema::hasColumn('bilties', 'advance_amount')) $table->decimal('advance_amount', 12, 2)->default(0);
                if (!Schema::hasColumn('bilties', 'balance_amount')) $table->decimal('balance_amount', 12, 2)->default(0);
                if (!Schema::hasColumn('bilties', 'payment_terms')) $table->string('payment_terms', 50)->default('to_pay');
                if (!Schema::hasColumn('bilties', 'remarks')) $table->text('remarks')->nullable();
                if (!Schema::hasColumn('bilties', 'authorized_by')) $table->string('authorized_by', 255)->nullable();
                if (!Schema::hasColumn('bilties', 'meta')) $table->json('meta')->nullable();
                if (!Schema::hasColumn('bilties', 'created_by_uuid')) $table->string('created_by_uuid', 191)->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bilties');
    }
};
