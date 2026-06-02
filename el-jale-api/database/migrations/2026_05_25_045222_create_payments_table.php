<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_job_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            
            // La máquina de estados del dinero
            $table->enum('status', [
                'pendiente',           // Aún no se ha pagado
                'retenido_en_app',     // El dinero lo tiene MAEWALLIS CORP
                'liberado_al_experto', // El cliente quedó feliz y se pagó
                'reembolsado'          // Hubo un problema y se devolvió al cliente
            ])->default('pendiente');
            
            $table->string('transaction_id')->nullable(); // Para el futuro con Stripe/MercadoPago
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
