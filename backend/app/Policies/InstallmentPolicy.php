<?php

namespace App\Policies;

use App\Models\Installment;
use App\Models\User;

class InstallmentPolicy
{
    /**
     * Only the owner can view their installment.
     */
    public function view(User $user, Installment $installment): bool
    {
        return $user->id === $installment->user_id;
    }

    /**
     * Only the owner can update their installment.
     */
    public function update(User $user, Installment $installment): bool
    {
        return $user->id === $installment->user_id;
    }

    /**
     * Only the owner can delete their installment.
     */
    public function delete(User $user, Installment $installment): bool
    {
        return $user->id === $installment->user_id;
    }
}
