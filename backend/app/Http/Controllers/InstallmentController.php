<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInstallmentRequest;
use App\Models\Installment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use App\Http\Resources\InstallmentResource;

class InstallmentController extends Controller
{
    /**
     * List the authenticated user's installments (cursor-paginated).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(50, max(1, $request->integer('per_page', 15)));

        $installments = $request->user()
            ->installments()
            ->latest()
            ->cursorPaginate($perPage);

        return InstallmentResource::collection($installments);
    }

    /**
     * Store a newly created installment.
     */
    public function store(StoreInstallmentRequest $request): JsonResponse
    {
        $installment = $request->user()->installments()->create([
            'category' => $request->validated('category'),
            'title' => $request->validated('title'),
            'data' => $request->validated('data'),
        ]);

        return (new InstallmentResource($installment))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified installment.
     */
    public function show(Request $request, Installment $installment): InstallmentResource
    {
        Gate::authorize('view', $installment);

        return new InstallmentResource($installment);
    }

    /**
     * Update the specified installment.
     */
    public function update(StoreInstallmentRequest $request, Installment $installment): InstallmentResource
    {
        Gate::authorize('update', $installment);

        $installment->update([
            'category' => $request->validated('category'),
            'title' => $request->validated('title'),
            'data' => $request->validated('data'),
        ]);

        return new InstallmentResource($installment->refresh());
    }

    /**
     * Remove the specified installment.
     */
    public function destroy(Request $request, Installment $installment): JsonResponse
    {
        Gate::authorize('delete', $installment);

        $installment->delete();

        return response()->json(['message' => 'Installment deleted.']);
    }
}
