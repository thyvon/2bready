<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\User\Actions\HandleGoogleCallbackAction;
use App\Domain\User\Exceptions\GoogleAuthRejectedException;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Socialite\Two\User as SocialiteUser;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->action = new HandleGoogleCallbackAction;
});

function fakeGoogleUser(string $id, string $email, string $name = 'Google User'): SocialiteUser
{
    $user = new SocialiteUser;
    $user->id = $id;
    $user->email = $email;
    $user->name = $name;

    return $user;
}

it('creates a new company_owner account for an unknown client-portal Google email', function () {
    $result = $this->action->execute(fakeGoogleUser('g-1', 'brandnew@example.com'), 'client');

    expect($result->email)->toBe('brandnew@example.com');
    expect($result->google_id)->toBe('g-1');
    expect($result->google_auth_enabled)->toBeTrue();
    expect($result->hasVerifiedEmail())->toBeTrue();
    expect($result->hasRole('company_owner'))->toBeTrue();
});

it('rejects an unknown Google email for admin-portal rather than auto-creating an internal account', function () {
    $this->action->execute(fakeGoogleUser('g-2', 'nobody@example.com'), 'admin');
})->throws(GoogleAuthRejectedException::class);

it('links an existing account by email on first Google sign-in', function () {
    $owner = User::factory()->companyOwner()->create(['email' => 'existing@example.com', 'google_auth_enabled' => true]);
    expect($owner->google_id)->toBeNull();

    $result = $this->action->execute(fakeGoogleUser('g-3', 'existing@example.com'), 'client');

    expect($result->id)->toBe($owner->id);
    expect($result->fresh()->google_id)->toBe('g-3');
});

it('verifies an existing unverified account\'s email on Google sign-in, like Vercel/GitHub-style OAuth does', function () {
    Notification::fake();

    $owner = User::factory()->companyOwner()->unverified()->create([
        'email' => 'unverified@example.com',
        'google_auth_enabled' => true,
    ]);
    expect($owner->hasVerifiedEmail())->toBeFalse();

    $result = $this->action->execute(fakeGoogleUser('g-8', 'unverified@example.com'), 'client');

    expect($result->fresh()->hasVerifiedEmail())->toBeTrue();
    // A successful Google sign-in is itself proof of email ownership — it
    // must never trigger the usual verification-link email on top of that.
    Notification::assertNotSentTo($owner, VerifyEmail::class);
});

it('rejects sign-in for an account that exists but has google_auth_enabled=false', function () {
    User::factory()->companyOwner()->create(['email' => 'notallowed@example.com', 'google_auth_enabled' => false]);

    $this->action->execute(fakeGoogleUser('g-4', 'notallowed@example.com'), 'client');
})->throws(GoogleAuthRejectedException::class);

it('rejects sign-in for a suspended account even if google_auth_enabled=true', function () {
    User::factory()->companyOwner()->create([
        'email' => 'suspended@example.com',
        'google_auth_enabled' => true,
        'status' => 'suspended',
    ]);

    $this->action->execute(fakeGoogleUser('g-5', 'suspended@example.com'), 'client');
})->throws(GoogleAuthRejectedException::class);

it('rejects a company account signing in through the admin portal', function () {
    $company = Company::factory()->create();
    User::factory()->companyOwner()->withCompany($company)->create([
        'email' => 'owner@example.com',
        'google_auth_enabled' => true,
    ]);

    $this->action->execute(fakeGoogleUser('g-6', 'owner@example.com'), 'admin');
})->throws(GoogleAuthRejectedException::class);

it('signs in an existing admin-portal account via Google when already linked and enabled', function () {
    $admin = User::factory()->admin()->create([
        'email' => 'admin@example.com',
        'google_id' => 'g-7',
        'google_auth_enabled' => true,
    ]);

    $result = $this->action->execute(fakeGoogleUser('g-7', 'admin@example.com'), 'admin');

    expect($result->id)->toBe($admin->id);
});
