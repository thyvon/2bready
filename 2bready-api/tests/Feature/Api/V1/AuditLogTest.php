<?php

declare(strict_types=1);

use App\Domain\AuditLog\Models\AuditLog;
use App\Domain\Company\Models\Company;
use App\Domain\Package\Models\Lead;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Immutability ──────────────────────────────────────────────────────────

it('refuses to update an audit log entry', function () {
    $log = AuditLog::create(['action' => 'test.created']);

    expect(fn () => $log->update(['action' => 'test.tampered']))
        ->toThrow(RuntimeException::class, 'AuditLog records are immutable and cannot be updated.');
});

it('refuses to delete an audit log entry', function () {
    $log = AuditLog::create(['action' => 'test.created']);

    expect(fn () => $log->delete())
        ->toThrow(RuntimeException::class, 'AuditLog records are immutable and cannot be deleted.');
});

// ─── Automatic capture via the Auditable trait ──────────────────────────────

it('records a create, update, and delete for an audited model', function () {
    $lead = Lead::create([
        'name' => 'Test Lead',
        'email' => 'lead@example.com',
        'phone' => null,
        'company_name' => null,
        'source' => 'paywall',
    ]);
    $lead->update(['name' => 'Renamed Lead']);
    $lead->delete();

    $actions = AuditLog::query()->where('auditable_id', $lead->id)->orderBy('created_at')->pluck('action');

    expect($actions->all())->toBe(['lead.created', 'lead.updated', 'lead.deleted']);

    // Compared key-by-key, not the whole nested array with toBe() — Postgres's
    // jsonb column type canonicalizes key order on storage (it does not preserve
    // insertion order the way the json type or a plain PHP array would), so
    // asserting the top-level array literal directly is order-flaky.
    $updated = AuditLog::query()->where('action', 'lead.updated')->first();
    expect($updated->changes['old'])->toBe(['name' => 'Test Lead']);
    expect($updated->changes['new'])->toBe(['name' => 'Renamed Lead']);
});

it('does not record an update that only touched timestamps', function () {
    $lead = Lead::create(['name' => 'Test Lead', 'email' => 'lead2@example.com', 'phone' => null, 'company_name' => null, 'source' => 'paywall']);
    DB::table('audit_logs')->truncate();

    $lead->touch();

    expect(AuditLog::query()->count())->toBe(0);
});

it('redacts a hidden field instead of dropping it from the diff', function () {
    $user = User::factory()->create();
    DB::table('audit_logs')->truncate();

    $user->forceFill(['password' => bcrypt('SomeNewPassword1')])->save();

    $log = AuditLog::query()->where('auditable_id', $user->id)->where('action', 'user.updated')->first();

    expect($log)->not->toBeNull();
    expect($log->changes['old'])->toBe(['password' => '[redacted]']);
    expect($log->changes['new'])->toBe(['password' => '[redacted]']);
});

// ─── Security events ─────────────────────────────────────────────────────────

it('records a failed login attempt with the attempted email, no user id', function () {
    User::factory()->withRole('company_owner')->create(['email' => 'user@example.com', 'password' => bcrypt('Secret1234')]);

    $this->postJson('/api/v1/auth/login', ['email' => 'user@example.com', 'password' => 'wrong']);

    $log = AuditLog::query()->where('action', 'auth.login_failed')->first();
    expect($log)->not->toBeNull();
    expect($log->actor_email)->toBe('user@example.com');
    expect($log->user_id)->toBeNull();
});

it('records a successful login', function () {
    User::factory()->withRole('company_owner')->create(['email' => 'user@example.com', 'password' => bcrypt('Secret1234')]);

    $this->postJson('/api/v1/auth/login', ['email' => 'user@example.com', 'password' => 'Secret1234']);

    expect(AuditLog::query()->where('action', 'auth.login')->where('actor_email', 'user@example.com')->exists())->toBeTrue();
});

it('records a wrong-portal login rejection', function () {
    User::factory()->admin()->create(['email' => 'admin@example.com', 'password' => bcrypt('Secret1234')]);

    $this->postJson('/api/v1/auth/login', ['email' => 'admin@example.com', 'password' => 'Secret1234']);

    $log = AuditLog::query()->where('action', 'auth.login_rejected_wrong_portal')->first();
    expect($log)->not->toBeNull();
    expect($log->metadata)->toBe(['required_permission' => 'portal.client.access']);
});

it('records a logout', function () {
    $user = User::factory()->withRole('company_owner')->create();
    $token = $user->createToken('api')->plainTextToken;

    $this->withToken($token)->postJson('/api/v1/auth/logout');

    expect(AuditLog::query()->where('action', 'auth.logout')->where('user_id', $user->id)->exists())->toBeTrue();
});

// ─── GET /audit-logs ─────────────────────────────────────────────────────────

it('lets an admin view audit logs across every company', function () {
    $admin = User::factory()->admin()->create();
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    // Setting up the fixtures above (User/Company/Industry factories) already
    // produced their own real audit entries — proof the feature works, but noise
    // for this assertion, which wants an exact count of two specific rows.
    DB::table('audit_logs')->truncate();
    AuditLog::create(['action' => 'company.updated', 'company_id' => $companyA->id]);
    AuditLog::create(['action' => 'company.updated', 'company_id' => $companyB->id]);

    $response = $this->actingAs($admin)->getJson('/api/v1/audit-logs');

    $response->assertOk();
    expect($response->json('meta.pagination.total'))->toBe(2);
});

it('scopes a company_owner to only their own company\'s audit logs', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($companyA)->create();
    AuditLog::create(['action' => 'company.updated', 'company_id' => $companyA->id]);
    AuditLog::create(['action' => 'company.updated', 'company_id' => $companyB->id]);

    $response = $this->actingAs($owner)->getJson('/api/v1/audit-logs');

    $response->assertOk();
    expect($response->json('meta.pagination.total'))->toBe(1);
    expect($response->json('data.0.company_id'))->toBe($companyA->id);
});

it('ignores a company_id filter a company_owner tries to pass, staying scoped to their own company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($companyA)->create();
    AuditLog::create(['action' => 'company.updated', 'company_id' => $companyB->id]);

    $response = $this->actingAs($owner)->getJson('/api/v1/audit-logs?company_id='.$companyB->id);

    $response->assertOk();
    expect($response->json('meta.pagination.total'))->toBe(0);
});

it('forbids a company_member from viewing audit logs', function () {
    $company = Company::factory()->create();
    $member = User::factory()->withRole('company_member')->withCompany($company)->create();

    $this->actingAs($member)->getJson('/api/v1/audit-logs')->assertForbidden();
});

it('requires authentication to view audit logs', function () {
    $this->getJson('/api/v1/audit-logs')->assertUnauthorized();
});

it('paginates and clamps per_page within bounds', function () {
    $admin = User::factory()->admin()->create();
    DB::table('audit_logs')->truncate();
    for ($i = 0; $i < 30; $i++) {
        AuditLog::create(['action' => "test.row_{$i}"]);
    }

    $response = $this->actingAs($admin)->getJson('/api/v1/audit-logs?per_page=200');
    $response->assertOk();
    expect($response->json('meta.pagination.per_page'))->toBe(100);

    $response = $this->actingAs($admin)->getJson('/api/v1/audit-logs?per_page=1');
    $response->assertOk();
    expect($response->json('meta.pagination.per_page'))->toBe(5);

    $response = $this->actingAs($admin)->getJson('/api/v1/audit-logs?per_page=10');
    $response->assertOk();
    expect($response->json('meta.pagination.per_page'))->toBe(10);
    expect($response->json('meta.pagination.last_page'))->toBe(3);
    expect($response->json('data'))->toHaveCount(10);
});
