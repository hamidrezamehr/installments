<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstallmentPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'installment_id',
        'installment_number',
        'paid_at',
        'payment_method',
        'note',
        'payment_date',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'payment_date' => 'date',
        ];
    }

    public function installment(): BelongsTo
    {
        return $this->belongsTo(Installment::class);
    }
}
