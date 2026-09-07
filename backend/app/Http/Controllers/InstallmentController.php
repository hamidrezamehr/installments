<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBankFacilityRequest;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\InstallmentResource;
use App\Models\Installment;
use App\Models\InstallmentPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstallmentController extends Controller
{
    /**
     * List all installments for the authenticated user.
     * GET /api/installments
     */
    public function index(Request $request)
    {
        $installments = Installment::where('user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->get();

        return InstallmentResource::collection($installments);
    }

    /**
     * Show a single installment with its payments.
     * GET /api/installments/{installment}
     */
    public function show(Installment $installment)
    {
        $this->authorize('view', $installment);

        $installment->load(['payments' => fn ($q) => $q->orderBy('installment_number')]);

        return new InstallmentResource($installment);
    }

    /**
     * Create a bank-facility installment.
     * POST /api/installments/bank-facility
     */
    public function storeBankFacility(StoreBankFacilityRequest $request)
    {
        $validated = $request->validated();

        $installment = Installment::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'category' => 'bank_facility',
            'data' => [
                'title' => $validated['title'],
                'bank_name' => $validated['bank_name'],
                'total_installments' => $validated['total_installments'],
                'total_loan_amount' => $validated['total_loan_amount'],
                'installment_amount' => $validated['installment_amount'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'payment_methods' => $validated['payment_methods'],
                'notes' => $validated['notes'] ?? null,
            ],
        ]);

        return (new InstallmentResource($installment))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Update an installment.
     * PUT /api/installments/{installment}
     */
    public function update(StoreBankFacilityRequest $request, Installment $installment)
    {
        $this->authorize('update', $installment);

        $validated = $request->validated();

        $installment->update([
            'title' => $validated['title'] ?? $installment->title,
            'data' => [
                'title' => $validated['title'] ?? $installment->data['title'],
                'bank_name' => $validated['bank_name'] ?? $installment->data['bank_name'],
                'total_installments' => $validated['total_installments'] ?? $installment->data['total_installments'],
                'total_loan_amount' => $validated['total_loan_amount'] ?? $installment->data['total_loan_amount'],
                'installment_amount' => $validated['installment_amount'] ?? $installment->data['installment_amount'],
                'start_date' => $validated['start_date'] ?? $installment->data['start_date'],
                'end_date' => $validated['end_date'] ?? $installment->data['end_date'],
                'payment_methods' => $validated['payment_methods'] ?? $installment->data['payment_methods'],
                'notes' => $validated['notes'] ?? $installment->data['notes'] ?? null,
            ],
        ]);

        return new InstallmentResource($installment);
    }

    /**
     * Delete an installment.
     * DELETE /api/installments/{installment}
     */
    public function destroy(Installment $installment): JsonResponse
    {
        $this->authorize('delete', $installment);

        $installment->delete();

        return response()->json(['message' => 'Installment deleted successfully']);
    }

    /**
     * Store payment for an installment.
     * POST /api/installments/{installment}/payments
     */
    public function storePayment(StorePaymentRequest $request, Installment $installment)
    {
        $this->authorize('update', $installment);

        $validated = $request->validated();
        $installmentNumber = $validated['installment_number'];
        $totalInstallments = $installment->data['total_installments'] ?? 0;

        if ($installmentNumber > $totalInstallments) {
            return response()->json(['message' => 'شماره قسط نامعتبر است'], 422);
        }

        $existingPayment = InstallmentPayment::where('installment_id', $installment->id)
            ->where('installment_number', $installmentNumber)
            ->first();

        if ($existingPayment) {
            return response()->json(['message' => 'این قسط قبلاً پرداخت شده است'], 409);
        }

        $payment = InstallmentPayment::create([
            'installment_id' => $installment->id,
            'installment_number' => $installmentNumber,
            'paid_at' => now(),
            'payment_method' => $validated['payment_method'],
            'payment_date' => $validated['payment_date'],
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'message' => 'پرداخت ثبت شد',
            'paid' => true,
            'payment' => [
                'id' => $payment->id,
                'installment_number' => $payment->installment_number,
                'paid_at' => $payment->paid_at,
                'payment_method' => $payment->payment_method,
                'payment_date' => $payment->payment_date?->format('Y-m-d'),
                'note' => $payment->note,
            ],
        ], 201);
    }

    /**
     * Delete payment for an installment (unpay).
     * DELETE /api/installments/{installment}/payments/{paymentNumber}
     */
    public function deletePayment(Installment $installment, int $paymentNumber): JsonResponse
    {
        $this->authorize('update', $installment);

        $payment = InstallmentPayment::where('installment_id', $installment->id)
            ->where('installment_number', $paymentNumber)
            ->first();

        if (! $payment) {
            return response()->json(['message' => 'پرداختی برای این قسط یافت نشد'], 404);
        }

        $payment->delete();

        return response()->json([
            'message' => 'پرداخت لغو شد',
            'paid' => false,
        ]);
    }
}
