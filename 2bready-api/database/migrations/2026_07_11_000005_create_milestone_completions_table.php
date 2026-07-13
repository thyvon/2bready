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
        Schema::create('milestone_completions', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('company_id', 26)->index();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->char('milestone_id', 26)->index();
            $table->foreign('milestone_id')->references('id')->on('milestones')->cascadeOnDelete();
            $table->timestamp('completed_at');
            $table->char('completed_by_user_id', 26)->nullable();
            $table->foreign('completed_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('trigger', 20);
            $table->timestamps();
            $table->softDeletes();

            // Not a hard unique constraint: soft-deleting a completion (an admin
            // undoing a mistaken sign-off) must allow a fresh completion to be
            // recorded afterward. "Already completed" is checked by the Action
            // against non-deleted rows instead.
            $table->index(['company_id', 'milestone_id']);
        });

        DB::statement("ALTER TABLE milestone_completions ADD CONSTRAINT milestone_completions_trigger_check CHECK (trigger IN ('document_upload','audit_approval','admin_signoff'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('milestone_completions');
    }
};
