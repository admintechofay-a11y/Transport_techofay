<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('freight_charges')) {
            Schema::create('freight_charges', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->nullable()->index();
                $table->string('load_uuid', 191)->nullable()->index();   // orders table
                $table->string('trip_uuid', 191)->nullable()->index();
                $table->string('customer_uuid', 191)->nullable()->index();
                // Charges breakdown
                $table->decimal('freight_amount', 12, 2)->default(0);
                $table->decimal('loading_charges', 12, 2)->default(0);
                $table->decimal('unloading_charges', 12, 2)->default(0);
                $table->decimal('detention_charges', 12, 2)->default(0);
                $table->decimal('toll_charges', 12, 2)->default(0);
                $table->decimal('handling_charges', 12, 2)->default(0);
                $table->decimal('miscellaneous_charges', 12, 2)->default(0);
                $table->json('additional_charges')->nullable(); // [{label, amount}] for custom charge types
                $table->decimal('total_charges', 12, 2)->default(0);    // computed: sum of all
                // Settlement
                $table->decimal('advance_paid', 12, 2)->default(0);
                $table->decimal('deductions', 12, 2)->default(0);
                $table->text('deduction_remarks')->nullable();
                $table->decimal('balance_payable', 12, 2)->default(0);  // computed: total - advance - deductions
                $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending');
                $table->text('remarks')->nullable();
                $table->string('created_by_uuid', 191)->nullable();
                $table->softDeletes();
                $table->timestamps();

                $table->index(['company_uuid', 'payment_status']);
                $table->index(['company_uuid', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('freight_charges');
    }
};
