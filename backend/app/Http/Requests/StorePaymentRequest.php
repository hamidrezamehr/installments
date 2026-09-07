<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'installment_number' => 'required|integer|min:1',
            'payment_method' => 'required|string|max:255',
            'payment_date' => 'required|date',
            'note' => 'nullable|string|max:1000',
        ];
    }
}
