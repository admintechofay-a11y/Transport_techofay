<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            if (!Schema::hasColumn('contacts', 'party_type')) {
                $table->enum('party_type', ['customer', 'consignor', 'consignee', 'transporter', 'other'])
                      ->default('customer');
            }
            if (!Schema::hasColumn('contacts', 'gstin')) {
                $table->string('gstin', 20)->nullable();
            }
            if (!Schema::hasColumn('contacts', 'pan_number')) {
                $table->string('pan_number', 20)->nullable();
            }
            if (!Schema::hasColumn('contacts', 'billing_address')) {
                $table->text('billing_address')->nullable();
            }
            if (!Schema::hasColumn('contacts', 'delivery_address')) {
                $table->text('delivery_address')->nullable();
            }
            if (!Schema::hasColumn('contacts', 'billing_city')) {
                $table->string('billing_city', 100)->nullable();
            }
            if (!Schema::hasColumn('contacts', 'billing_state')) {
                $table->string('billing_state', 100)->nullable();
            }
            if (!Schema::hasColumn('contacts', 'billing_pincode')) {
                $table->string('billing_pincode', 20)->nullable();
            }
            if (!Schema::hasColumn('contacts', 'payment_terms')) {
                $table->enum('payment_terms', ['immediate', 'net_7', 'net_15', 'net_30', 'net_45', 'net_60'])
                      ->default('net_30')->nullable();
            }
            if (!Schema::hasColumn('contacts', 'notes')) {
                $table->text('notes')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $columns = [
                'party_type', 'gstin', 'pan_number', 'billing_address', 'delivery_address',
                'billing_city', 'billing_state', 'billing_pincode', 'payment_terms', 'notes'
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('contacts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
