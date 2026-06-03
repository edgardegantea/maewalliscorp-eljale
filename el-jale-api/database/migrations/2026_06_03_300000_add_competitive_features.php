<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fotos en reseñas
        Schema::table('reviews', function (Blueprint $table) {
            if (!Schema::hasColumn('reviews', 'photos')) {
                $table->json('photos')->nullable()->after('comment');
            }
        });

        // Método de pago + modo urgente en trabajos
        Schema::table('service_jobs', function (Blueprint $table) {
            if (!Schema::hasColumn('service_jobs', 'is_urgent')) {
                $table->boolean('is_urgent')->default(false)->after('urgency');
            }
            if (!Schema::hasColumn('service_jobs', 'urgent_fee_multiplier')) {
                $table->decimal('urgent_fee_multiplier', 3, 2)->default(1.00)->after('is_urgent');
            }
            if (!Schema::hasColumn('service_jobs', 'repeat_from_job_id')) {
                $table->unsignedBigInteger('repeat_from_job_id')->nullable()->after('urgent_fee_multiplier');
            }
        });

        // Método de pago en payments
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'payment_method')) {
                $table->string('payment_method', 20)->default('mercadopago')->after('status');
                // efectivo | mercadopago | transferencia | oxxo
            }
            if (!Schema::hasColumn('payments', 'cash_confirmed_at')) {
                $table->timestamp('cash_confirmed_at')->nullable()->after('payment_method');
            }
        });

        // Badge seguro de trabajo en expert_profiles
        Schema::table('expert_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('expert_profiles', 'has_guarantee')) {
                $table->boolean('has_guarantee')->default(false)->after('badge_most_requested');
            }
        });
    }

    public function down(): void
    {
        Schema::table('reviews', fn($t) => $t->dropColumn('photos'));
        Schema::table('service_jobs', fn($t) => $t->dropColumn(['is_urgent','urgent_fee_multiplier','repeat_from_job_id']));
        Schema::table('payments', fn($t) => $t->dropColumn(['payment_method','cash_confirmed_at']));
        Schema::table('expert_profiles', fn($t) => $t->dropColumn('has_guarantee'));
    }
};
