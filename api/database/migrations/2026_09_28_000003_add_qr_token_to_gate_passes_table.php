<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('gate_passes') && !Schema::hasColumn('gate_passes', 'qr_token')) {
            Schema::table('gate_passes', function (Blueprint $table) {
                $table->string('qr_token', 255)->nullable()->index()->after('remarks');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('gate_passes') && Schema::hasColumn('gate_passes', 'qr_token')) {
            Schema::table('gate_passes', function (Blueprint $table) {
                $table->dropColumn('qr_token');
            });
        }
    }
};
