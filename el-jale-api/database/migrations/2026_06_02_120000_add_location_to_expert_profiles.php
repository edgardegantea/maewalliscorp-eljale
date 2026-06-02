<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->string('city')->nullable()->after('hourly_rate');
            $table->string('state')->nullable()->after('city');
            $table->decimal('latitude', 10, 7)->nullable()->after('state');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->integer('coverage_radius_km')->default(15)->after('longitude');
        });

        Schema::table('service_jobs', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('preferred_time');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('city')->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->dropColumn(['city', 'state', 'latitude', 'longitude', 'coverage_radius_km']);
        });
        Schema::table('service_jobs', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'city']);
        });
    }
};
