<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('installment_payments', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('installment_number');
            $table->string('note')->nullable()->after('payment_method');
            $table->date('payment_date')->nullable()->after('note');
        });
    }

    public function down(): void
    {
        Schema::table('installment_payments', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'note', 'payment_date']);
        });
    }
};
