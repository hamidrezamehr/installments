<?php

namespace Tests\Feature;

use App\Models\Installment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_list_installments(): void
    {
        $this->getJson('/api/installments')->assertUnauthorized();
    }

    public function test_unverified_users_cannot_access_installments(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/installments');

        $response->assertForbidden();
    }

    public function test_user_can_create_a_bank_facility_installment(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/installments', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('category', 'bank_facility')
            ->assertJsonPath('data.bank_name', 'بانک ملت');

        $this->assertDatabaseHas('installments', [
            'user_id' => $user->id,
            'category' => 'bank_facility',
        ]);
    }

    public function test_store_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/installments', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['category', 'title', 'data']);
    }

    public function test_store_rejects_end_date_before_start_date(): void
    {
        $user = User::factory()->create();

        $payload = $this->validPayload();
        $payload['data']['end_date'] = '2020-01-01';

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/installments', $payload);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['data.end_date']);
    }

    public function test_user_can_list_only_their_own_installments(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Installment::factory()->count(3)->for($user)->create();
        Installment::factory()->for($other)->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/installments');

        $response->assertOk()
            ->assertJsonCount(3);
    }

    public function test_user_cannot_view_another_users_installment(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $installment = Installment::factory()->for($other)->create();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/installments/{$installment->id}")
            ->assertForbidden();
    }

    public function test_user_cannot_update_another_users_installment(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $installment = Installment::factory()->for($other)->create();

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/installments/{$installment->id}", $this->validPayload())
            ->assertForbidden();
    }

    public function test_user_cannot_delete_another_users_installment(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $installment = Installment::factory()->for($other)->create();

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/installments/{$installment->id}")
            ->assertForbidden();
    }

    public function test_user_can_update_their_own_installment(): void
    {
        $user = User::factory()->create();
        $installment = Installment::factory()->for($user)->create();

        $payload = $this->validPayload();
        $payload['title'] = 'وام به‌روزرسانی شده';

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/installments/{$installment->id}", $payload)
            ->assertOk()
            ->assertJsonPath('title', 'وام به‌روزرسانی شده');
    }

    public function test_user_can_delete_their_own_installment(): void
    {
        $user = User::factory()->create();
        $installment = Installment::factory()->for($user)->create();

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/installments/{$installment->id}")
            ->assertOk();

        $this->assertDatabaseMissing('installments', ['id' => $installment->id]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'category' => 'bank_facility',
            'title' => 'وام مسکن بانک ملت',
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
            ],
        ];
    }
}
