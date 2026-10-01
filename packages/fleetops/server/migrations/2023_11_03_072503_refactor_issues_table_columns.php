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
        Schema::table('issues', function (Blueprint $table) {
            $colsToDrop = array_filter(['longitude', 'latitude', 'odometer'], fn($col) => Schema::hasColumn('issues', $col));
            if (!empty($colsToDrop)) {
                $table->dropColumn($colsToDrop);
            }
            if (!Schema::hasColumn('issues', 'category')) {
                $table->string('category')->nullable()->after('type');
            }
            if (!Schema::hasColumn('issues', 'tags')) {
                $table->json('tags')->nullable()->after('priority');
            }
            if (!Schema::hasColumn('issues', 'meta')) {
                $table->json('meta')->nullable()->after('priority');
            }
            if (DB::getDriverName() !== 'sqlite') {
                $table->mediumText('report')->change();
            }
            if (!Schema::hasColumn('issues', 'reported_by_uuid')) {
                $table->foreignUuid('reported_by_uuid')->nullable()->after('assigned_to_uuid')->references('uuid')->on('users')->onDelete('cascade');
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
        Schema::table('issues', function (Blueprint $table) {
            $table->string('longitude')->nullable()->after('location');
            $table->string('latitude')->nullable()->after('location');
            $table->string('odometer')->nullable()->after('location');
            $table->string('report')->change();
            $table->dropForeign(['reported_by_uuid']);
            $table->dropColumn(['reported_by_uuid', 'meta', 'tags', 'category']);
        });
    }
};
