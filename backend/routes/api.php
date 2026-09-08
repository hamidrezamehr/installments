<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\InstallmentController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:5,1');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:10,1');

Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::post('/verify-email/resend', [AuthController::class, 'resendVerificationEmail'])
        ->middleware('throttle:3,1')
        ->name('verification.send');
});

Route::get('/email/verify/notice', fn () => response()->json([
    'message' => 'Your email address is not verified.',
]))
    ->middleware('auth:sanctum')
    ->name('verification.notice');

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/installments', [InstallmentController::class, 'index']);
    Route::post('/installments', [InstallmentController::class, 'store']);
    Route::get('/installments/{installment}', [InstallmentController::class, 'show']);
    Route::put('/installments/{installment}', [InstallmentController::class, 'update']);
    Route::delete('/installments/{installment}', [InstallmentController::class, 'destroy']);
});
