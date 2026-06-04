<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('job_bids', function (Blueprint $table) {
            $table->decimal('counter_amount', 10, 2)->nullable()->after('amount');
            $table->text('counter_message')->nullable()->after('counter_amount');
            $table->enum('counter_status', ['none','pending','accepted','rejected'])->default('none')->after('counter_message');
            $table->boolean('requires_visit')->default(false)->after('counter_status');
            $table->date('visit_date')->nullable()->after('requires_visit');
        });
    }
    public function down(): void
    {
        Schema::table('job_bids', function (Blueprint $table) {
            $table->dropColumn(['counter_amount','counter_message','counter_status','requires_visit','visit_date']);
        });
    }
};
