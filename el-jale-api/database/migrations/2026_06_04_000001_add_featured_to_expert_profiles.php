<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->boolean('is_featured')->default(false)->after('is_premium');
            $table->timestamp('featured_until')->nullable()->after('is_featured');
            $table->string('featured_preference_id')->nullable()->after('featured_until');
        });
    }

    public function down(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->dropColumn(['is_featured', 'featured_until', 'featured_preference_id']);
        });
    }
};
