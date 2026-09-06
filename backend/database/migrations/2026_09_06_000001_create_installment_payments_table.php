<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installment_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('installment_id')->constrained('installments')->cascadeOnDelete();
            $table->unsignedSmallInteger('installment_number');
            $table->timestamp('paid_at');
            $table->timestamps();

            // Prevent duplicate payments for same installment
            $table->unique(['installment_id', 'installment_number']);
            $table->index('installment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installment_payments');
    }
};
