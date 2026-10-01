<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('lr_sequences')) {
            Schema::create('lr_sequences', function (Blueprint $table) {
                $table->increments('id');
                $table->string('company_uuid', 191)->index();
                $table->integer('year')->index();
                $table->unsignedBigInteger('current_sequence')->default(0);
                $table->timestamps();

                $table->unique(['company_uuid', 'year'], 'unique_company_year_seq');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lr_sequences');
    }
};
