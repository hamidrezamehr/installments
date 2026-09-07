<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBankFacilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'bank_name' => 'required|string|max:255',
            'total_installments' => 'required|integer|min:1|max:360',
            'total_loan_amount' => 'required|numeric|min:0',
            'installment_amount' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'payment_methods' => 'required|array|min:1',
            'payment_methods.*.type' => 'required|string|in:card_transfer,account_number,facility_number',
            'payment_methods.*.label' => 'required|string',
            'payment_methods.*.value' => 'nullable|string',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
