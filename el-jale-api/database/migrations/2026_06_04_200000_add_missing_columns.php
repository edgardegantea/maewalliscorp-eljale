<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Columnas de disponibilidad y video en expert_profiles
        Schema::table('expert_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('expert_profiles', 'available_days')) {
                $table->json('available_days')->nullable()->after('coverage_radius_km');
            }
            if (!Schema::hasColumn('expert_profiles', 'available_from')) {
                $table->string('available_from', 5)->nullable()->after('available_days'); // HH:MM
            }
            if (!Schema::hasColumn('expert_profiles', 'available_to')) {
                $table->string('available_to', 5)->nullable()->after('available_from');
            }
            if (!Schema::hasColumn('expert_profiles', 'video_url')) {
                $table->string('video_url')->nullable()->after('available_to');
            }
        });

        // Conekta order id en payments
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'conekta_order_id')) {
                $table->string('conekta_order_id')->nullable()->after('mp_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->dropColumn(['available_days', 'available_from', 'available_to', 'video_url']);
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('conekta_order_id');
        });
    }
};
