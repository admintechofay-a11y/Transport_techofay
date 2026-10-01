<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->nullable()->index();
                $table->string('user_uuid', 191)->nullable()->index();
                $table->string('action', 50)->index();
                $table->string('entity_type', 191)->index();
                $table->string('entity_uuid', 191)->index();
                $table->json('before')->nullable();
                $table->json('after')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->softDeletes();
                $table->timestamps();

                $table->index(['company_uuid', 'action']);
                $table->index(['company_uuid', 'entity_type']);
                $table->index(['company_uuid', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
