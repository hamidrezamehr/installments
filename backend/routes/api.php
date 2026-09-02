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
        ->middleware('throttle:3,1');

    // Installments
    Route::get('/installments', [InstallmentController::class, 'index']);
    Route::post('/installments/bank-facility', [InstallmentController::class, 'storeBankFacility']);
    Route::get('/installments/{id}', [InstallmentController::class, 'show']);
    Route::put('/installments/{id}', [InstallmentController::class, 'update']);
    Route::delete('/installments/{id}', [InstallmentController::class, 'destroy']);
});
