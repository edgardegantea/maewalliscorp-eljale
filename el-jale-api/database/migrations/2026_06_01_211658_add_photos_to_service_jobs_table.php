<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_jobs', function (Blueprint $table) {
            // Fotos del problema (subidas por el cliente al publicar)
            $table->json('client_photos')->nullable()->after('budget');
            // Fotos de evidencia de trabajo terminado (subidas por el experto)
            $table->json('expert_photos')->nullable()->after('client_photos');
            // Dirección del trabajo
            $table->string('address')->nullable()->after('expert_photos');
        });
    }

    public function down(): void
    {
        Schema::table('service_jobs', function (Blueprint $table) {
            $table->dropColumn(['client_photos', 'expert_photos', 'address']);
        });
    }
};
