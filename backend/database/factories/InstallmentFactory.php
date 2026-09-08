<?php

namespace Database\Factories;

use App\Models\Installment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Installment>
 */
class InstallmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'category' => 'bank_facility',
            'title' => fake()->randomElement([
                'وام مسکن بانک ملت',
                'وام خودرو بانک سامان',
                'وام ازدواج بانک ملی',
            ]),
            'data' => [
                'title' => 'وام مسکن بانک ملت',
                'bank_name' => 'بانک ملت',
                'total_installments' => 12,
                'total_loan_amount' => 500000000,
                'installment_amount' => 45000000,
                'start_date' => '2026-01-01',
                'end_date' => '2026-12-31',
                'payment_methods' => [
                    [
                        'type' => 'card_transfer',
                        'label' => 'کارت به کارت',
                        'value' => '6037-9911-0000-0000',
                    ],
                ],
                'notes' => null,
            ],
        ];
    }
}
