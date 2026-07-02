<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\User\DTOs\RegisterUserData;
use App\Domain\User\Models\User;
use Illuminate\Auth\Events\Registered;

class RegisterUserAction
{
    public function execute(RegisterUserData $data): User
    {
        $user = User::create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password,
            'locale' => $data->locale,
        ]);

        $user->assignRole('company_owner');

        event(new Registered($user));

        return $user;
    }
}
