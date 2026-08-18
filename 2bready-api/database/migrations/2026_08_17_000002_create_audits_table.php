<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// The audit — the level-level review verdict for a company's compliance
// journey, tied 1:1 to a TpHire (the paid engagement that funds the review).
// No deleted_at — audit records are compliance evidence; cancelled_at is the
// explicit terminal state. journey_level is denormalized from the hire so a
// hire's level is never ambiguous later, and score is only ever filled once
// a decision is made (approval), per the ERD.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audits', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('company_id', 26)->index();
            $table->char('tp_hire_id', 26)->index();
            // Nullable until an auditor is assigned. References auditors.id
            // (the profile row), never users.id directly — Rule #4.
            $table->char('auditor_id', 26)->nullable()->index();
            // 'L2' | 'L3' | 'L4' — mirrors tp_hires.journey_level.
            $table->string('journey_level', 10);

            $table->string('status', 20)->default('pending');
            // Nullable — filled when the audit is approved (ERD). The auditor's
            // recommendation lands here at submit; the approved score is the
            // calculated compliance score (ComplianceScoreService).
            $table->integer('score')->nullable();
            $table->text('feedback')->nullable();

            $table->timestamp('deadline')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            // Audit records are compliance evidence — a hire must never be
            // silently dropped out from under one, so restrict rather than cascade.
            $table->foreign('tp_hire_id')->references('id')->on('tp_hires')->restrictOnDelete();
            $table->foreign('auditor_id')->references('id')->on('auditors')->nullOnDelete();

            // One audit per hire — prevents accidental duplicate audits for the
            // same engagement (a re-review is a state transition, not a new row).
            $table->unique('tp_hire_id');
        });

        DB::statement("ALTER TABLE audits ADD CONSTRAINT audits_journey_level_check CHECK (journey_level IN ('L2','L3','L4'))");
        DB::statement("ALTER TABLE audits ADD CONSTRAINT audits_status_check CHECK (status IN ('pending','in_progress','submitted','approved','rejected','cancelled'))");
        DB::statement('ALTER TABLE audits ADD CONSTRAINT audits_score_check CHECK (score IS NULL OR (score >= 0 AND score <= 100))');

        Schema::create('audit_documents', function (Blueprint $table) {
            $table->char('audit_id', 26);
            $table->char('document_id', 26);

            $table->primary(['audit_id', 'document_id']);

            $table->foreign('audit_id')->references('id')->on('audits')->cascadeOnDelete();
            $table->foreign('document_id')->references('id')->on('documents')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_documents');
        Schema::dropIfExists('audits');
    }
};
