<?php

namespace App\Http\Controllers;

use App\Models\Installment;
use App\Models\InstallmentPayment;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InstallmentController extends Controller
{
    /**
     * Check that the installments table exists.
     */
    private function ensureTableExists(): ?JsonResponse
    {
        if (! Schema::hasTable('installments')) {
            return response()->json([
                'message' => 'خطای سرور: جدول اقساط هنوز ایجاد نشده است. لطفاً مایگریشن‌ها را اجرا کنید.',
            ], 500);
        }

        return null;
    }

    /**
     * List all installments for the authenticated user.
     * GET /api/installments
     */
    public function index(Request $request): JsonResponse
    {
        if ($tableError = $this->ensureTableExists()) {
            return $tableError;
        }

        try {
            $installments = Installment::where('user_id', $request->user()->id)
                ->orderByDesc('updated_at')
                ->get();

            return response()->json($installments);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'خطا در دریافت لیست اقساط',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show a single installment with its payments.
     * GET /api/installments/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        if ($tableError = $this->ensureTableExists()) {
            return $tableError;
        }

        try {
            $installment = Installment::where('user_id', $request->user()->id)
                ->with(['payments' => function ($query) {
                    $query->select('id', 'installment_id', 'installment_number', 'paid_at', 'payment_method', 'note', 'payment_date')
                        ->orderBy('installment_number');
                }])
                ->findOrFail($id);

            return response()->json($installment);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'خطا در دریافت اطلاعات قسط',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a bank-facility installment.
     * POST /api/installments/bank-facility
     */
    public function storeBankFacility(Request $request): JsonResponse
    {
        if ($tableError = $this->ensureTableExists()) {
            return $tableError;
        }

        $validated = $request->validate([
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
        ]);

        try {
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

            return response()->json($installment, 201);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'خطا در ثبت اطلاعات تسهیلات',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an installment.
     * PUT /api/installments/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if ($tableError = $this->ensureTableExists()) {
            return $tableError;
        }

        $installment = Installment::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'bank_name' => 'sometimes|required|string|max:255',
            'total_installments' => 'sometimes|required|integer|min:1|max:360',
            'total_loan_amount' => 'sometimes|required|numeric|min:0',
            'installment_amount' => 'sometimes|required|numeric|min:0',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after_or_equal:start_date',
            'payment_methods' => 'sometimes|required|array|min:1',
            'payment_methods.*.type' => 'required|string|in:card_transfer,account_number,facility_number',
            'payment_methods.*.label' => 'required|string',
            'payment_methods.*.value' => 'nullable|string',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
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

            return response()->json($installment);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'خطا در بروزرسانی اطلاعات',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an installment.
     * DELETE /api/installments/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($tableError = $this->ensureTableExists()) {
            return $tableError;
        }

        $installment = Installment::where('user_id', $request->user()->id)
            ->findOrFail($id);

        try {
            $installment->delete();

            return response()->json(['message' => 'Installment deleted successfully']);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'خطا در حذف قسط',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store payment for an installment.
     * POST /api/installments/{id}/payments
     *
     * Creates a payment record with details.
     * If payment already exists for this installment_number, return error.
     */
    public function storePayment(Request $request, int $id): JsonResponse
    {
        if ($tableError = $this->ensureTableExists()) {
            return $tableError;
        }

        $installment = Installment::where('user_id', $request->user()->id)
            ->with('payments')
            ->findOrFail($id);

        $validated = $request->validate([
            'installment_number' => 'required|integer|min:1',
            'payment_method' => 'required|string|max:255',
            'payment_date' => 'required|date',
            'note' => 'nullable|string|max:1000',
        ]);

        $installmentNumber = $validated['installment_number'];
        $totalInstallments = $installment->data['total_installments'] ?? 0;

        // Validate installment number is within range
        if ($installmentNumber > $totalInstallments) {
            return response()->json([
                'message' => 'شماره قسط نامعتبر است',
            ], 422);
        }

        try {
            // Check if payment already exists
            $existingPayment = InstallmentPayment::where('installment_id', $installment->id)
                ->where('installment_number', $installmentNumber)
                ->first();

            if ($existingPayment) {
                return response()->json([
                    'message' => 'این قسط قبلاً پرداخت شده است',
                ], 409);
            }

            // Create payment record
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
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'خطا در ثبت پرداخت',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete payment for an installment (unpay).
     * DELETE /api/installments/{id}/payments/{paymentNumber}
     */
    public function deletePayment(Request $request, int $id, int $paymentNumber): JsonResponse
    {
        if ($tableError = $this->ensureTableExists()) {
            return $tableError;
        }

        $installment = Installment::where('user_id', $request->user()->id)
            ->findOrFail($id);

        try {
            $payment = InstallmentPayment::where('installment_id', $installment->id)
                ->where('installment_number', $paymentNumber)
                ->first();

            if (!$payment) {
                return response()->json([
                    'message' => 'پرداختی برای این قسط یافت نشد',
                ], 404);
            }

            $payment->delete();

            return response()->json([
                'message' => 'پرداخت لغو شد',
                'paid' => false,
            ]);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'خطا در لغو پرداخت',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }
}
