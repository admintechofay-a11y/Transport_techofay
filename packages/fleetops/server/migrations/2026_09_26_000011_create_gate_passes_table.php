<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('gate_passes')) {
            Schema::create('gate_passes', function (Blueprint $table) {
                $table->increments('id');
                $table->string('uuid', 191)->unique()->nullable();
                $table->string('public_id', 191)->unique()->nullable();
                $table->string('company_uuid', 191)->nullable()->index();
                $table->string('load_uuid', 191)->nullable()->index();
                $table->string('vehicle_uuid', 191)->nullable()->index();
                $table->string('driver_uuid', 191)->nullable()->index();
                $table->string('gate_pass_number', 100)->unique();
                $table->enum('pass_type', ['in', 'out', 'both'])->default('out');
                $table->timestamp('in_time')->nullable();
                $table->timestamp('out_time')->nullable();
                $table->string('authorized_by', 255)->nullable();
                $table->string('security_name', 255)->nullable();
                $table->text('remarks')->nullable();
                $table->softDeletes();
                $table->timestamps();

                $table->index(['company_uuid', 'pass_type']);
                $table->index(['company_uuid', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('gate_passes');
    }
};
