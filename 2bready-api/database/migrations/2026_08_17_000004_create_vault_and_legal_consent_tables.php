<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Vault + LegalConsent (v3 §3.3, §4.2, §5.1) — two thin, isolated domains
// layered on top of Document/DataRoom, not modifying them.
//
// Vault: companies.vault_pin_hash is the PIN store (bcrypt, configurable
// length via platform_settings.vault_pin_length, seed 6). vault_unlock_logs
// is the access trail — one row per unlock session, closed by a locked_at.
// Auto-lock is enforced server-side by VaultAutoLockService reading
// platform_settings.vault_auto_lock_minutes (seed 3), never a frontend timer.
//
// LegalConsent: legal_consents gates restricted P3/P4 (L3/L4) document
// actions client-side. consent_text_version is versioned so old consents
// remain valid evidence after terms change. Every consent also writes an
// audit_logs entry (action: legal_consent_recorded) via its domain event.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            // bcrypt hash of the company's Vault PIN (v3 §4.2). Nullable until
            // an admin sets one (ResetVaultPinAction). Never returned in any
            // API response.
            $table->string('vault_pin_hash')->nullable()->after('bypass_flags');
        });

        Schema::create('vault_unlock_logs', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            // admin or finance role — finance is further restricted to
            // self-uploaded sensitive documents only (v3 §5.1).
            $table->char('user_id', 26)->index();
            $table->char('company_id', 26)->index();
            $table->timestamp('unlocked_at');
            // Nullable — an open session until auto-lock/manual lock/role
            // change closes it with a lock_reason.
            $table->timestamp('locked_at')->nullable();
            // enum: timeout, manual, role_change
            $table->string('lock_reason', 20)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        DB::statement("ALTER TABLE vault_unlock_logs ADD CONSTRAINT vault_unlock_logs_lock_reason_check CHECK (lock_reason IS NULL OR lock_reason IN ('timeout','manual','role_change'))");

        Schema::create('legal_consents', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('user_id', 26)->index();
            $table->char('company_id', 26)->index();
            // enum: P3, P4 — the restricted document tiers this consent gates.
            $table->string('pathway_level', 10);
            // Versioned consent text — old consents remain valid evidence.
            $table->string('consent_text_version', 40);
            $table->timestamp('accepted_at');
            // Nullable — filled from the request when available.
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        DB::statement("ALTER TABLE legal_consents ADD CONSTRAINT legal_consents_pathway_level_check CHECK (pathway_level IN ('P3','P4'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_consents');
        Schema::dropIfExists('vault_unlock_logs');
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn('vault_pin_hash');
        });
    }
};
