<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            // Nullable — internal actions (staff managing a package, admin editing
            // platform settings) aren't scoped to any one company. Deliberately not
            // using the BelongsToCompany trait on the model: that trait's global
            // scope would silently filter every query to the current user's
            // company, which is wrong for a history an internal user must be able
            // to see across all companies.
            $table->char('company_id', 26)->nullable();
            // Nullable — a failed login attempt with an unrecognized email has no
            // resolvable user. actor_email is captured separately for that case.
            $table->char('user_id', 26)->nullable();
            $table->string('actor_email')->nullable();
            // Dot-notation, e.g. "company.updated", "payment.confirmed",
            // "auth.login_failed" — see Auditable trait and AuthController.
            $table->string('action');
            // Polymorphic target for model-mutation entries (nullable — security
            // events like auth.login have no single record they're "about").
            $table->string('auditable_type')->nullable();
            $table->char('auditable_id', 26)->nullable();
            $table->jsonb('changes')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            // No updated_at — append-only, see the immutability note below.
            $table->timestamp('created_at')->useCurrent();

            $table->index('company_id');
            $table->index('user_id');
            $table->index('action');
            $table->index(['auditable_type', 'auditable_id']);
            $table->index('created_at');

            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        // Write-once, enforced at the DB layer, not just by convention (mirrored by
        // AuditLog::save()/delete() refusing both at the application layer too, for
        // the common case where the app's own DB role is a superuser — e.g. Sail's
        // default local dev role — where a REVOKE against that same role is a
        // silent no-op, since PostgreSQL superusers bypass all grants). Takes real
        // effect wherever the app connects as a genuinely least-privileged role, as
        // it should in production.
        $connection = config('database.default');
        $username = config("database.connections.{$connection}.username");

        if ($username) {
            // Postgres identifier quoting (double quotes, internal quotes doubled) —
            // a role name is an identifier here, not a string literal, so PDO::quote()
            // (which produces a single-quoted string literal) would be the wrong kind
            // of escaping.
            $quotedUsername = '"'.str_replace('"', '""', $username).'"';
            DB::statement("REVOKE UPDATE, DELETE ON audit_logs FROM {$quotedUsername}");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
