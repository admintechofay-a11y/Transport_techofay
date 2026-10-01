<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('driver_documents')) {
            Schema::create('driver_documents', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->nullable()->index();
                $table->string('driver_uuid', 191)->nullable()->index();
                $table->enum('document_type', [
                    'driving_licence', 'aadhaar', 'pan', 'police_verification',
                    'medical_certificate', 'other'
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
                $table->index(['driver_uuid', 'is_active']);
            });
        } else {
            Schema::table('driver_documents', function (Blueprint $table) {
                if (!Schema::hasColumn('driver_documents', 'document_label')) $table->string('document_label', 255)->nullable();
                if (!Schema::hasColumn('driver_documents', 'file_uuid')) $table->string('file_uuid', 191)->nullable();
                if (!Schema::hasColumn('driver_documents', 'file_url')) $table->string('file_url', 500)->nullable();
                if (!Schema::hasColumn('driver_documents', 'issued_date')) $table->date('issued_date')->nullable();
                if (!Schema::hasColumn('driver_documents', 'issuing_authority')) $table->string('issuing_authority', 255)->nullable();
                if (!Schema::hasColumn('driver_documents', 'document_number')) $table->string('document_number', 100)->nullable();
                if (!Schema::hasColumn('driver_documents', 'notes')) $table->text('notes')->nullable();
                if (!Schema::hasColumn('driver_documents', 'created_by_uuid')) $table->string('created_by_uuid', 191)->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_documents');
    }
};
