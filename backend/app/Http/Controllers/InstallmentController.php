<?php

namespace App\Http\Controllers;

use App\Models\Installment;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
     * Show a single installment.
     * GET /api/installments/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        if ($tableError = $this->ensureTableExists()) {
            return $tableError;
        }

        try {
            $installment = Installment::where('user_id', $request->user()->id)
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
}
