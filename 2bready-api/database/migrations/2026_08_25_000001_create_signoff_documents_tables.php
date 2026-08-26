<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Signed-off Documents replaces the authored-SOP system entirely —
     * SOPs are client-uploaded files, verified by the platform, then emailed
     * to staff for read & acknowledge. Dev-stage: the old sops/sop_signoffs
     * rows were demo-only (same drop-and-rebuild precedent as industry_code).
     */
    public function up(): void
    {
        // The adoption join table is named sop_company (singular) in the
        // original migration — cover both spellings defensively.
        Schema::dropIfExists('signoff_document_users_backup');
        Schema::dropIfExists('sop_signoffs');
        Schema::dropIfExists('sop_companies');
        Schema::dropIfExists('sop_company');
        Schema::dropIfExists('sops');

        Schema::create('signoff_documents', function (Blueprint $table): void {
            $table->char('id', 26)->primary();
            $table->char('company_id', 26)->index();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->string('category', 30);
            $table->string('title');
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type', 127);
            $table->unsignedBigInteger('size_bytes');
            // pending_review -> verified | rejected. Rejected keeps the file
            // so the owner can see why via rejection_comment and re-upload.
            $table->string('status', 20)->default('pending_review')->index();
            $table->text('rejection_comment')->nullable();
            $table->char('uploaded_by_user_id', 26)->nullable()->index();
            $table->foreign('uploaded_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->char('verified_by_user_id', 26)->nullable()->index();
            $table->foreign('verified_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'status']);
        });

        DB::statement("ALTER TABLE signoff_documents ADD CONSTRAINT signoff_documents_category_check CHECK (category IN ('sales','marketing','finance','production','hr','other'))");
        DB::statement("ALTER TABLE signoff_documents ADD CONSTRAINT signoff_documents_status_check CHECK (status IN ('pending_review','verified','rejected'))");

        Schema::create('signoff_document_users', function (Blueprint $table): void {
            $table->char('id', 26)->primary();
            $table->char('signoff_document_id', 26)->index();
            $table->foreign('signoff_document_id')->references('id')->on('signoff_documents')->cascadeOnDelete();
            $table->char('company_id', 26)->index();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->char('user_id', 26)->index();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamp('emailed_at')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();

            $table->unique(['signoff_document_id', 'user_id'], 'uq_signoff_document_user');
            $table->index(['user_id', 'signed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signoff_document_users');
        Schema::dropIfExists('signoff_documents');
    }
};
