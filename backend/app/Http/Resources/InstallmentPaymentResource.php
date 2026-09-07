<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InstallmentPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'installment_id' => $this->installment_id,
            'installment_number' => $this->installment_number,
            'paid_at' => $this->paid_at,
            'payment_method' => $this->payment_method,
            'payment_date' => $this->payment_date?->format('Y-m-d'),
            'note' => $this->note,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
