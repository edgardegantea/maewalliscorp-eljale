<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->boolean('is_premium')->default(false)->after('onboarding_step');
            $table->timestamp('premium_expires_at')->nullable()->after('is_premium');
            $table->string('mp_subscription_preference_id')->nullable()->after('premium_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->dropColumn(['is_premium', 'premium_expires_at', 'mp_subscription_preference_id']);
        });
    }
};
