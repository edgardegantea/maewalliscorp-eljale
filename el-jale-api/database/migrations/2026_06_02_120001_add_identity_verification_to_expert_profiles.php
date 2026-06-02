<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->string('id_front_path')->nullable()->after('coverage_radius_km');
            $table->string('id_back_path')->nullable()->after('id_front_path');
            $table->string('selfie_path')->nullable()->after('id_back_path');
            $table->enum('verification_status', ['sin_documentos', 'documentos_enviados', 'verificado', 'rechazado'])
                  ->default('sin_documentos')->after('selfie_path');
            $table->text('rejection_reason')->nullable()->after('verification_status');
            $table->timestamp('verified_at')->nullable()->after('rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('expert_profiles', function (Blueprint $table) {
            $table->dropColumn(['id_front_path','id_back_path','selfie_path','verification_status','rejection_reason','verified_at']);
        });
    }
};
