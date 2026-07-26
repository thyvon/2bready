<?php

declare(strict_types=1);

use App\Domain\Shared\Services\PlatformSettingService;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\PersonalAccessToken;
use PragmaRX\Google2FA\Google2FA;

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

// ─── Admin login ─────────────────────────────────────────────────────────────

it('logs in an internal user via admin-login', function () {
    User::factory()->withRole('admin')->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/admin-login', [
        'email' => 'admin@example.com',
        'password' => 'Secret1234',
    ])->assertOk()->assertJsonStructure(['data' => ['user', 'token', 'totp_required']]);
});

it('rejects a company user via admin-login', function () {
    User::factory()->withRole('company_owner')->create([
        'email' => 'owner@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/admin-login', [
        'email' => 'owner@example.com',
        'password' => 'Secret1234',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');

    // No token should have been issued to this account.
    expect(User::where('email', 'owner@example.com')->first()->tokens()->count())->toBe(0);
});

it('rejects wrong credentials via admin-login the same as regular login', function () {
    User::factory()->withRole('admin')->create(['email' => 'admin2@example.com', 'password' => bcrypt('correct')]);

    $this->postJson('/api/v1/auth/admin-login', [
        'email' => 'admin2@example.com',
        'password' => 'wrong',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');
});

// auditor was previously admin-portal-gated (portal.admin.access); it now
// grants portal.tp.access instead (see RolePermissionSeeder) — TP staff log
// into tp-portal, not admin-portal. Full tp-login coverage lives in
// TpAuthTest.php.
it('rejects an auditor via admin-login now that TP staff use tp-portal instead', function () {
    User::factory()->withRole('auditor')->create([
        'email' => 'auditor@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/admin-login', [
        'email' => 'auditor@example.com',
        'password' => 'Secret1234',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');
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

    $response = $this->actingAs($user)
        ->postJson('/api/v1/auth/totp/setup')
        ->assertOk()
        ->assertJsonStructure(['data' => ['secret', 'qr_code_url']]);

    // Regression: pragmarx/google2fa-qrcode only wraps its output as a data: URI when the
    // imagick PHP extension is loaded — without it (as in the production image), it
    // silently returns raw SVG XML text instead, which is useless as an <img src>. This
    // must always be a data: URI regardless of which extensions happen to be installed.
    expect($response->json('data.qr_code_url'))->toStartWith('data:');
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

it('admin-login flags totp_required=true for admin without 2FA set up', function () {
    $admin = User::factory()->admin()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/admin-login', [
        'email' => 'admin@example.com',
        'password' => 'Secret1234',
    ])->assertOk()
        ->assertJsonPath('data.totp_required', true)
        ->assertJsonPath('data.totp_confirmed', false);
});

it('admin-login flags totp_confirmed=true for admin with 2FA enabled', function () {
    $admin = User::factory()->admin()->withTotp()->create([
        'email' => 'admin2@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/admin-login', [
        'email' => 'admin2@example.com',
        'password' => 'Secret1234',
    ])->assertOk()
        ->assertJsonPath('data.totp_required', true)
        ->assertJsonPath('data.totp_confirmed', true);
});

it('lets a company_owner log in without 2FA by default even with two_factor_required left unset', function () {
    $owner = User::factory()->companyOwner()->create([
        'email' => 'owner@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'owner@example.com',
        'password' => 'Secret1234',
    ])->assertOk()->assertJsonPath('data.totp_required', false);
});

it('forces 2FA on a company_owner whose two_factor_required override is explicitly true', function () {
    $owner = User::factory()->companyOwner()->create([
        'email' => 'owner-2fa@example.com',
        'password' => bcrypt('Secret1234'),
        'two_factor_required' => true,
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'owner-2fa@example.com',
        'password' => 'Secret1234',
    ])->assertOk()
        ->assertJsonPath('data.totp_required', true)
        ->assertJsonPath('data.totp_confirmed', false);
});

it('exempts an admin from 2FA whose two_factor_required override is explicitly false', function () {
    $admin = User::factory()->admin()->create([
        'email' => 'exempt-admin@example.com',
        'password' => bcrypt('Secret1234'),
        'two_factor_required' => false,
    ]);

    $this->postJson('/api/v1/auth/admin-login', [
        'email' => 'exempt-admin@example.com',
        'password' => 'Secret1234',
    ])->assertOk()->assertJsonPath('data.totp_required', false);
});

it('lets an already-enrolled admin log in without a TOTP challenge when 2FA is globally disabled', function () {
    $admin = User::factory()->admin()->withTotp()->create([
        'email' => 'demo-admin@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    app(PlatformSettingService::class)->set('two_factor_globally_enabled', false, 'security');

    $this->postJson('/api/v1/auth/admin-login', [
        'email' => 'demo-admin@example.com',
        'password' => 'Secret1234',
    ])->assertOk()->assertJsonPath('data.totp_required', false);
});

it('still enforces 2FA when the two_factor_globally_enabled setting is absent (default on)', function () {
    $admin = User::factory()->admin()->create([
        'email' => 'default-admin@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/admin-login', [
        'email' => 'default-admin@example.com',
        'password' => 'Secret1234',
    ])->assertOk()->assertJsonPath('data.totp_required', true);
});

it('rejects an internal user via the regular (client-portal) login', function () {
    User::factory()->admin()->create([
        'email' => 'admin3@example.com',
        'password' => bcrypt('Secret1234'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin3@example.com',
        'password' => 'Secret1234',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');
});

// ─── 2FA token-ability enforcement (pending tokens must not reach business routes) ──

it('blocks a pending-totp token (2FA not yet set up) from reaching a business route', function () {
    $admin = User::factory()->admin()->create();
    $token = $admin->createToken('api-pending-totp', ['totp-pending'])->plainTextToken;

    $this->withToken($token)->getJson('/api/v1/companies')
        ->assertForbidden()
        ->assertJsonPath('message', 'Two-factor authentication is required to access this resource.');
});

it('blocks a pending-totp token (2FA enabled, challenge not completed) from reaching a business route', function () {
    $admin = User::factory()->admin()->withTotp()->create();
    $token = $admin->createToken('api-pending-totp', ['totp-pending'])->plainTextToken;

    $this->withToken($token)->getJson('/api/v1/companies')->assertForbidden();
});

it('lets a pending-totp token still reach auth/totp/* and logout', function () {
    $admin = User::factory()->admin()->withTotp()->create();
    $token = $admin->createToken('api-pending-totp', ['totp-pending'])->plainTextToken;

    $this->withToken($token)->postJson('/api/v1/auth/totp/verify', ['code' => '000000'])
        ->assertUnprocessable(); // reaches the endpoint's own validation, not blocked by 403

    $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();
});

it('lets a fully-capable token reach a business route', function () {
    $admin = User::factory()->admin()->create();
    $token = $admin->createToken('api')->plainTextToken;

    $this->withToken($token)->getJson('/api/v1/companies')->assertOk();
});

it('upgrades to a fully-capable token after totp/confirm succeeds', function () {
    $admin = User::factory()->admin()->create();
    $admin->update(['two_factor_secret' => encrypt('JBSWY3DPEHPK3PXP')]);
    $pending = $admin->createToken('api-pending-totp', ['totp-pending']);

    $code = (new Google2FA)->getCurrentOtp('JBSWY3DPEHPK3PXP');

    $response = $this->withToken($pending->plainTextToken)->postJson('/api/v1/auth/totp/confirm', ['code' => $code]);
    $response->assertOk()->assertJsonStructure(['data' => ['token', 'message']]);

    // The pending token record itself must be gone (not just superseded), and the new
    // one must be a plain default-abilities token (able to reach business routes) —
    // checked directly rather than via a second in-test HTTP call, since Laravel's auth
    // guard caches the resolved user for the lifetime of the test process, which would
    // mask a mid-test token change behind a stale cached resolution.
    expect(PersonalAccessToken::find($pending->accessToken->id))->toBeNull();

    $newTokenModel = $admin->fresh()->tokens()->latest('id')->first();
    expect($newTokenModel->name)->toBe('api');
    expect($newTokenModel->can('*'))->toBeTrue();
});

it('upgrades to a fully-capable token after totp/verify succeeds', function () {
    $admin = User::factory()->admin()->withTotp()->create();
    $admin->forceFill(['two_factor_secret' => encrypt('JBSWY3DPEHPK3PXP')])->save();
    $pending = $admin->createToken('api-pending-totp', ['totp-pending']);

    $code = (new Google2FA)->getCurrentOtp('JBSWY3DPEHPK3PXP');

    $response = $this->withToken($pending->plainTextToken)->postJson('/api/v1/auth/totp/verify', ['code' => $code]);
    $response->assertOk()->assertJsonStructure(['data' => ['token', 'message']]);

    expect(PersonalAccessToken::find($pending->accessToken->id))->toBeNull();

    $newTokenModel = $admin->fresh()->tokens()->latest('id')->first();
    expect($newTokenModel->name)->toBe('api');
    expect($newTokenModel->can('*'))->toBeTrue();
});

// ─── Rate limiting ───────────────────────────────────────────────────────────

it('throttles repeated login attempts for the same email', function () {
    User::factory()->create(['email' => 'throttle@example.com', 'password' => bcrypt('Secret1234')]);

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/auth/login', ['email' => 'throttle@example.com', 'password' => 'wrong'])
            ->assertUnprocessable();
    }

    $this->postJson('/api/v1/auth/login', ['email' => 'throttle@example.com', 'password' => 'wrong'])
        ->assertStatus(429);
});

it('throttles repeated totp/verify attempts for the same user', function () {
    $admin = User::factory()->admin()->withTotp()->create();
    $token = $admin->createToken('api-pending-totp', ['totp-pending'])->plainTextToken;

    for ($i = 0; $i < 5; $i++) {
        $this->withToken($token)->postJson('/api/v1/auth/totp/verify', ['code' => '000000'])
            ->assertUnprocessable();
    }

    $this->withToken($token)->postJson('/api/v1/auth/totp/verify', ['code' => '000000'])
        ->assertStatus(429);
});

// ─── Email verification ─────────────────────────────────────────────────────

it('blocks an unverified company_owner from reaching a business route', function () {
    $owner = User::factory()->companyOwner()->unverified()->create();

    $this->actingAs($owner)->getJson('/api/v1/companies')->assertForbidden();
});

it('lets a verified company_owner reach business routes normally', function () {
    $owner = User::factory()->companyOwner()->create();
    expect($owner->hasVerifiedEmail())->toBeTrue();

    // company.list is admin/staff-only, but the point here is only that
    // email.verified doesn't itself reject the request — a 403 from a
    // different, unrelated gate would still prove this.
    $response = $this->actingAs($owner)->getJson('/api/v1/companies');
    $response->assertForbidden();
    expect($response->json('message'))->not->toBe('Please verify your email address to continue.');
});

it('verifies email via the signed link and lets the account through afterward', function () {
    $owner = User::factory()->companyOwner()->unverified()->create();
    expect($owner->hasVerifiedEmail())->toBeFalse();

    $hash = sha1($owner->getEmailForVerification());
    $expires = now()->addMinutes(60)->unix();

    $this->postJson("/api/v1/auth/email/verify/{$owner->id}/{$hash}", ['expires' => $expires])
        ->assertOk();

    expect($owner->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('rejects an expired or tampered verification link', function () {
    $owner = User::factory()->companyOwner()->unverified()->create();

    $this->postJson("/api/v1/auth/email/verify/{$owner->id}/wrong-hash", ['expires' => now()->addMinutes(60)->unix()])
        ->assertForbidden();

    expect($owner->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('lets an unverified user resend their own verification email', function () {
    Notification::fake();

    $owner = User::factory()->companyOwner()->unverified()->create();

    $this->actingAs($owner)->postJson('/api/v1/auth/email/verify/resend')->assertOk();

    Notification::assertSentTo($owner, VerifyEmail::class);
});
