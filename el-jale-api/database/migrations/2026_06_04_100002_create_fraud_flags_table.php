<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fraud_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');      // multiple_disputes, rapid_cancel, ip_mismatch, suspicious_payment
            $table->text('description');
            $table->string('severity');  // low, medium, high
            $table->boolean('resolved')->default(false);
            $table->string('resolution')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('fraud_flags'); }
};
