<?php

declare(strict_types=1);

use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Register ────────────────────────────────────────────────────────────────

it('registers a new user', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'Secret1234',
        'password_confirmation' => 'Secret1234',
    ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'data' => ['user' => ['id', 'name', 'email', 'roles'], 'token'],
        ]);

    expect(User::where('email', 'jane@example.com')->exists())->toBeTrue();
});

it('rejects register with duplicate email', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/v1/auth/register', [
        'name' => 'Dup',
        'email' => 'taken@example.com',
        'password' => 'Secret1234',
        'password_confirmation' => 'Secret1234',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('rejects register with weak password', function () {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'Test',
        'email' => 'test@example.com',
        'password' => 'short',
        'password_confirmation' => 'short',
    ])->assertUnprocessable()->assertJsonValidationErrors('password');
});

// ─── Login ───────────────────────────────────────────────────────────────────

it('logs in with valid credentials', function () {
    User::factory()->withRole('company_owner')->create([
        'email' => 'user@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'user@example.com',
        'password' => 'Secret1234',
    ])->assertOk()->assertJsonStructure(['data' => ['user', 'token', 'totp_required']]);
});

it('returns 422 on wrong credentials', function () {
    User::factory()->create(['email' => 'user@example.com', 'password' => bcrypt('correct')]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'user@example.com',
        'password' => 'wrong',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('returns 403 for suspended user', function () {
    User::factory()->suspended()->create([
        'email' => 'banned@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'banned@example.com',
        'password' => 'Secret1234',
    ])->assertForbidden();
});

// ─── Logout ──────────────────────────────────────────────────────────────────

it('logs out and deletes the token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('api')->plainTextToken;

    $this->withToken($token)
        ->postJson('/api/v1/auth/logout')
        ->assertNoContent();

    expect($user->tokens()->count())->toBe(0);
});

it('returns 401 on logout without token', function () {
    $this->postJson('/api/v1/auth/logout')->assertUnauthorized();
});

// ─── Me ──────────────────────────────────────────────────────────────────────

it('returns authenticated user profile', function () {
    $user = User::factory()->withRole('company_owner')->create();

    $this->actingAs($user)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.email', $user->email);
});

it('returns 401 for unauthenticated me', function () {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
});

// ─── Forgot / Reset Password ──────────────────────────────────────────────────

it('sends password reset link', function () {
    Notification::fake();
    $user = User::factory()->create(['email' => 'reset@example.com']);

    $this->postJson('/api/v1/auth/forgot-password', ['email' => 'reset@example.com'])
        ->assertOk();

    Notification::assertSentTo($user, ResetPassword::class);
});

it('returns ok even for unknown email (prevents enumeration)', function () {
    $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nope@example.com'])
        ->assertOk();
});

it('resets password with valid token', function () {
    Notification::fake();
    $user = User::factory()->create(['email' => 'reset2@example.com']);

    $this->postJson('/api/v1/auth/forgot-password', ['email' => 'reset2@example.com']);

    $token = null;
    Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$token) {
        $token = $notification->token;

        return true;
    });

    $this->postJson('/api/v1/auth/reset-password', [
        'token' => $token,
        'email' => 'reset2@example.com',
        'password' => 'NewSecret99',
        'password_confirmation' => 'NewSecret99',
    ])->assertOk();
});

// ─── TOTP Setup ──────────────────────────────────────────────────────────────

it('generates a TOTP secret for authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/v1/auth/totp/setup')
        ->assertOk()
        ->assertJsonStructure(['data' => ['secret', 'qr_code_url']]);
});

it('returns 401 on TOTP setup without auth', function () {
    $this->postJson('/api/v1/auth/totp/setup')->assertUnauthorized();
});

// ─── TOTP Confirm ────────────────────────────────────────────────────────────

it('rejects TOTP confirm with invalid code', function () {
    $user = User::factory()->withTotp()->create();

    $this->actingAs($user)
        ->postJson('/api/v1/auth/totp/confirm', ['code' => '000000'])
        ->assertUnprocessable();
});

it('requires digits for TOTP code', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/v1/auth/totp/confirm', ['code' => 'abcdef'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('code');
});

// ─── TOTP Verify ─────────────────────────────────────────────────────────────

it('rejects TOTP verify with invalid code', function () {
    $user = User::factory()->withTotp()->create();

    $this->actingAs($user)
        ->postJson('/api/v1/auth/totp/verify', ['code' => '000000'])
        ->assertUnprocessable();
});

it('returns 401 on TOTP verify without auth', function () {
    $this->postJson('/api/v1/auth/totp/verify', ['code' => '123456'])->assertUnauthorized();
});

// ─── 2FA enforcement ─────────────────────────────────────────────────────────

it('login flags totp_required=true for admin without 2FA set up', function () {
    $admin = User::factory()->admin()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@example.com',
        'password' => 'Secret1234',
    ])->assertOk()
        ->assertJsonPath('data.totp_required', true)
        ->assertJsonPath('data.totp_confirmed', false);
});

it('login flags totp_confirmed=true for admin with 2FA enabled', function () {
    $admin = User::factory()->admin()->withTotp()->create([
        'email' => 'admin2@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin2@example.com',
        'password' => 'Secret1234',
    ])->assertOk()
        ->assertJsonPath('data.totp_required', true)
        ->assertJsonPath('data.totp_confirmed', true);
});
