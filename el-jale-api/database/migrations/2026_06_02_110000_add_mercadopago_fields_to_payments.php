<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('mp_preference_id')->nullable()->after('transaction_id');
            $table->string('mp_payment_id')->nullable()->after('mp_preference_id');
            $table->string('mp_status')->nullable()->after('mp_payment_id');
            $table->decimal('platform_fee', 10, 2)->default(0)->after('mp_status');
            $table->decimal('expert_amount', 10, 2)->default(0)->after('platform_fee');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['mp_preference_id', 'mp_payment_id', 'mp_status', 'platform_fee', 'expert_amount']);
        });
    }
};
