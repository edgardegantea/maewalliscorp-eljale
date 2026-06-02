<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_jobs', function (Blueprint $table) {
            $table->date('preferred_date')->nullable()->after('address');
            $table->time('preferred_time')->nullable()->after('preferred_date');
            $table->enum('urgency', ['normal', 'urgente'])->default('normal')->after('preferred_time');
        });
    }

    public function down(): void
    {
        Schema::table('service_jobs', function (Blueprint $table) {
            $table->dropColumn(['preferred_date', 'preferred_time', 'urgency']);
        });
    }
};
