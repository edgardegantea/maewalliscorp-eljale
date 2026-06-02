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
        Schema::create('service_jobs', function (Blueprint $table) {
            $table->id();
            // El cliente que crea el trabajo
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            
            // El experto asignado (es nulo al principio cuando se está "buscando")
            $table->foreignId('expert_id')->nullable()->constrained('users')->nullOnDelete();
            
            // El oficio requerido (Plomería, Electricidad, etc.)
            $table->foreignId('category_id')->constrained();
            
            $table->string('title'); // Ej: "Fuga de agua en el baño"
            $table->text('description'); // Detalles del problema
            
            // Presupuesto base para evitar regateos
            $table->decimal('budget', 10, 2)->nullable(); 
            
            // Máquina de estados del trabajo
            $table->enum('status', [
                'buscando', 
                'asignado', 
                'en_progreso', 
                'completado', 
                'cancelado'
            ])->default('buscando');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_jobs');
    }
};
