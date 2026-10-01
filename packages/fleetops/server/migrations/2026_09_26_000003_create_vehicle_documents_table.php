<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('vehicle_documents')) {
            Schema::create('vehicle_documents', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->nullable()->index();
                $table->string('vehicle_uuid', 191)->nullable()->index();
                $table->enum('document_type', [
                    'rc', 'insurance', 'puc', 'fitness_certificate',
                    'permit', 'national_permit', 'tax', 'other'
                ]);
                $table->string('document_label', 255)->nullable(); // for 'other' type
                $table->string('file_uuid', 191)->nullable();      // links to Fleetbase media/files
                $table->string('file_url', 500)->nullable();
                $table->date('issued_date')->nullable();
                $table->date('expiry_date')->nullable()->index();  // indexed for expiry alerts
                $table->string('issuing_authority', 255)->nullable();
                $table->string('document_number', 100)->nullable();
                $table->text('notes')->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('created_by_uuid', 191)->nullable();
                $table->softDeletes();
                $table->timestamps();

                $table->index(['company_uuid', 'document_type']);
                $table->index(['vehicle_uuid', 'is_active']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_documents');
    }
};
