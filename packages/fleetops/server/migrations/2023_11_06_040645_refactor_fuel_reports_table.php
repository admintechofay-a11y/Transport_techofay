<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('fuel_reports', function (Blueprint $table) {
            $colsToDrop = array_filter(['longitude', 'latitude'], fn($col) => Schema::hasColumn('fuel_reports', $col));
            if (!empty($colsToDrop)) {
                $table->dropColumn($colsToDrop);
            }
            if (!Schema::hasColumn('fuel_reports', 'meta')) {
                $table->json('meta')->nullable()->after('metric_unit');
            }
            if (!Schema::hasColumn('fuel_reports', 'report')) {
                $table->mediumText('report')->nullable()->after('vehicle_uuid');
            }
            if (!Schema::hasColumn('fuel_reports', 'reported_by_uuid')) {
                $table->foreignUuid('reported_by_uuid')->nullable()->after('vehicle_uuid')->references('uuid')->on('users')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('fuel_reports', function (Blueprint $table) {
            $table->string('longitude')->nullable()->after('location');
            $table->string('latitude')->nullable()->after('location');
            $table->dropForeign(['reported_by_uuid']);
            $table->dropColumn(['reported_by_uuid', 'meta', 'report']);
        });
    }
};
