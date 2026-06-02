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
        Schema::create('expert_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained();
            $table->text('bio')->nullable();
            $table->integer('experience_years');
            
            // El valor de ser un "Especialista Verificado"
            $table->boolean('is_verified')->default(false); 
            
            // Kit Socio Fundador (los primeros 50)
            $table->boolean('is_founding_member')->default(false); 
            
            // Calificación para el algoritmo de recomendación
            $table->decimal('average_rating', 3, 2)->default(0.00); 
            $table->integer('total_reviews')->default(0);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expert_profiles');
    }
};
