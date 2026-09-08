<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInstallmentRequest extends FormRequest
{
    /**
     * Authorization is handled in the controller via ownership scoping
     * (users can only ever touch their own installments).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string|Rule>>
     */
    public function rules(): array
    {
        return [
            'category' => ['required', 'string', Rule::in([
                'bank_facility',
                'charity_fund',
                'home_lottery',
                'bill_payment',
                'tuition',
                'loan',
                'other',
            ])],
            'title' => ['required', 'string', 'max:255'],
            'data' => ['required', 'array'],
            'data.title' => ['required', 'string', 'max:255'],
            'data.bank_name' => ['required', 'string', 'max:255'],
            'data.total_installments' => ['required', 'integer', 'min:1', 'max:360'],
            'data.total_loan_amount' => ['required', 'numeric', 'min:0'],
            'data.installment_amount' => ['required', 'numeric', 'min:0'],
            'data.start_date' => ['required', 'date'],
            'data.end_date' => ['required', 'date', 'after_or_equal:data.start_date'],
            'data.payment_methods' => ['required', 'array', 'min:1'],
            'data.payment_methods.*.type' => ['required', 'string', Rule::in([
                'card_transfer',
                'account_number',
                'facility_number',
            ])],
            'data.payment_methods.*.label' => ['required', 'string', 'max:255'],
            'data.payment_methods.*.value' => ['required', 'string', 'max:255'],
            'data.notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
