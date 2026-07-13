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
        Schema::create('documents', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('company_id', 26)->index();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->char('document_template_id', 26)->index();
            $table->foreign('document_template_id')->references('id')->on('document_templates')->restrictOnDelete();
            $table->char('uploaded_by_user_id', 26)->nullable();
            $table->foreign('uploaded_by_user_id')->references('id')->on('users')->nullOnDelete();
            // Storage key only — never a public URL. Served exclusively via
            // signed URLs (see CLAUDE.md's non-negotiable rules).
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->string('status', 20)->default('pending_scan');
            $table->text('rejection_reason')->nullable();
            $table->char('verified_by_user_id', 26)->nullable();
            $table->foreign('verified_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Append-only, audit-sensitive (§5.2 design notes) — a company can
            // re-upload after rejection/expiry, so this is deliberately not
            // unique; the latest row per (company_id, document_template_id) is
            // the current one, older rows are the compliance history.
            $table->index(['company_id', 'document_template_id']);
            $table->index('status');
        });

        DB::statement("ALTER TABLE documents ADD CONSTRAINT documents_status_check CHECK (status IN ('pending_scan','scan_failed','review','verified','rejected','expired'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
