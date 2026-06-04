<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('rfc', 13)->nullable();
            $table->string('email')->unique();
            $table->string('contact_name');
            $table->string('phone', 20)->nullable();
            $table->string('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->enum('plan', ['starter', 'pro', 'enterprise'])->default('starter');
            $table->integer('monthly_budget')->nullable();   // MXN
            $table->integer('jobs_this_month')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('company_id')->nullable()->after('id');
            $table->string('whatsapp_number', 20)->nullable()->after('phone');
            $table->boolean('whatsapp_opt_in')->default(false)->after('whatsapp_number');
            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn(['company_id', 'whatsapp_number', 'whatsapp_opt_in']);
        });
        Schema::dropIfExists('companies');
    }
};
