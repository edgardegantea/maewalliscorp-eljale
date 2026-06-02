<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->boolean('onboarding_completed')->default(false)->after('badge_most_requested');
            $table->unsignedTinyInteger('onboarding_step')->default(0)->after('onboarding_completed');
        });
    }

    public function down(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->dropColumn(['onboarding_completed', 'onboarding_step']);
        });
    }
};
