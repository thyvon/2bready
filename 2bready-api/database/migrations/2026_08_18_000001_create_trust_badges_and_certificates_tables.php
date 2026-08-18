<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Sprint 6 (v3 §1.6): the externally verifiable credential — the product's
// payoff. trust_badges is the tenant-scoped record of an approved audit
// having earned its level; certificates extends it with the generated PDF +
// QR artifacts and the denormalized master-verifier stamp snapshot (v3 §0.3),
// so historical certificates never change if the platform setting is later
// updated. No deleted_at on either — badges/certificates are compliance
// evidence (same reasoning as audits); trust_badges.expires_at is the
// explicit lifecycle signal when/if badges get an expiry. certificates has NO
// company_id on purpose: the public verify page (v3 §1.5) reads it through a
// narrow, denormalized lookup by audit_id only — never through an
// authenticated tenant path.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trust_badges', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('company_id', 26)->index();
            $table->char('journey_level_id', 26)->index();
            $table->char('audit_id', 26)->index();
            // 'L1'-'L4' — denormalized for display; source of truth is
            // journey_level_id (ERD). Mirrors audits.journey_level.
            $table->string('level', 10);
            $table->timestamp('issued_at');
            $table->timestamp('expires_at')->nullable();
            // v3: the QR the public verify page resolves — nullable until
            // GenerateCertificateJob completes (ERD).
            $table->string('qr_payload_url', 512)->nullable();
            // Nullable — the admin whose review triggered issuance.
            $table->char('issued_by', 26)->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('journey_level_id')->references('id')->on('journey_levels')->restrictOnDelete();
            $table->foreign('audit_id')->references('id')->on('audits')->restrictOnDelete();
            $table->foreign('issued_by')->references('id')->on('users')->nullOnDelete();

            // One badge per earned level per audit — a re-audit is a state
            // transition on the same audit, not a new badge.
            $table->unique(['audit_id', 'journey_level_id']);
        });

        Schema::create('certificates', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('trust_badge_id', 26)->index();
            // QR/verify URL (verify.2bready.asia/{auditId}) uses the audit ID
            // directly per confirmed blueprint behavior — v3 §1.6.
            $table->char('audit_id', 26)->index();
            $table->string('pdf_url', 512);
            $table->string('qr_payload_url', 512);
            // v3: denormalized snapshot of platform_settings verifier text at
            // issuance time, so historical certificates don't change if the
            // setting is later updated.
            $table->json('master_verifier_stamp');
            $table->timestamp('issued_at');
            $table->timestamp('created_at');
            // Intentionally no updated_at — a certificate is issued once.

            $table->foreign('trust_badge_id')->references('id')->on('trust_badges')->cascadeOnDelete();
            $table->foreign('audit_id')->references('id')->on('audits')->restrictOnDelete();

            // One certificate per badge.
            $table->unique('trust_badge_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('trust_badges');
    }
};
