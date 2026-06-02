<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->boolean('badge_top_rated')->default(false)->after('verified_at');
            $table->boolean('badge_fast_responder')->default(false)->after('badge_top_rated');
            $table->boolean('badge_most_requested')->default(false)->after('badge_fast_responder');
            $table->timestamp('badges_updated_at')->nullable()->after('badge_most_requested');
        });
    }

    public function down(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->dropColumn(['badge_top_rated','badge_fast_responder','badge_most_requested','badges_updated_at']);
        });
    }
};
