<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('transport_settings')) {
            Schema::create('transport_settings', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->unique();
                $table->string('company_logo_url', 500)->nullable();
                $table->string('gstin', 20)->nullable();
                $table->text('company_address')->nullable();
                $table->string('company_phone', 50)->nullable();
                $table->string('company_email', 100)->nullable();
                $table->text('pdf_terms_conditions')->nullable();
                $table->string('signature_url', 500)->nullable();
                $table->json('custom_pdf_fields')->nullable(); // [{label, value}]
                $table->json('whatsapp_settings')->nullable();
                $table->json('meta')->nullable();
                $table->softDeletes();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_settings');
    }
};
