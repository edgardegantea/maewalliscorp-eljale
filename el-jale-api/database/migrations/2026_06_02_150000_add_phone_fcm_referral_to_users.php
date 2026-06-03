<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->boolean('phone_verified')->default(false)->after('phone');
            $table->string('phone_otp')->nullable()->after('phone_verified');
            $table->timestamp('phone_otp_expires_at')->nullable()->after('phone_otp');
            $table->string('fcm_token')->nullable()->after('phone_otp_expires_at');
            $table->string('referral_code', 10)->nullable()->unique()->after('fcm_token');
            $table->unsignedBigInteger('referred_by')->nullable()->after('referral_code');
            $table->foreign('referred_by')->references('id')->on('users')->nullOnDelete();
        });

        // Tabla de créditos de referidos
        Schema::create('referral_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('referred_user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 8, 2)->default(50.00); // $50 MXN por referido
            $table->boolean('used')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'phone_verified', 'phone_otp', 'phone_otp_expires_at', 'fcm_token', 'referral_code', 'referred_by']);
        });
        Schema::dropIfExists('referral_credits');
    }
};
