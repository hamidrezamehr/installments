<?php

namespace App\Policies;

use App\Models\Installment;
use App\Models\User;

class InstallmentPolicy
{
    /**
     * Determine whether the user can view the installment.
     */
    public function view(User $user, Installment $installment): bool
    {
        return $user->id === $installment->user_id;
    }

    /**
     * Determine whether the user can update the installment.
     */
    public function update(User $user, Installment $installment): bool
    {
        return $user->id === $installment->user_id;
    }

    /**
     * Determine whether the user can delete the installment.
     */
    public function delete(User $user, Installment $installment): bool
    {
        return $user->id === $installment->user_id;
    }
}
