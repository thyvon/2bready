<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sops', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('title');
            $table->string('version')->default('1.0');
            $table->text('content_en');
            $table->text('content_kh')->nullable();
            $table->dateTime('effective_at')->nullable();
            $table->boolean('is_active')->default(false);
            $table->ulid('company_id')->nullable()->index();
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->ulid('created_by_user_id')->nullable()->index();
            $table->foreign('created_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // A company can have at most one active SOP per title+version combo
            $table->unique(['company_id', 'title', 'version'], 'sops_company_title_version_unique');
        });

        // Company-specific SOP adoptions (company uses a global SOP with optional overrides)
        Schema::create('sop_company', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('sop_id')->index();
            $table->foreign('sop_id')->references('id')->on('sops')->onDelete('cascade');
            $table->ulid('company_id')->index();
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->text('override_content_en')->nullable();
            $table->text('override_content_kh')->nullable();
            $table->dateTime('adopted_at');
            $table->ulid('adopted_by_user_id')->nullable()->index();
            $table->foreign('adopted_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['sop_id', 'company_id'], 'sop_company_sop_company_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sop_company');
        Schema::dropIfExists('sops');
    }
};
