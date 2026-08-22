<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sop_signoffs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('sop_id')->index();
            $table->foreign('sop_id')->references('id')->on('sops')->onDelete('cascade');
            // Denormalized from the SOP for the BelongsToCompany tenant scope.
            $table->ulid('company_id')->index();
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            // The employee who must read & acknowledge. Null-on-delete keeps
            // the sign-off history when an employee leaves the company.
            $table->ulid('user_id')->nullable()->index();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->ulid('sent_by_user_id')->nullable()->index();
            $table->foreign('sent_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();

            // One sign-off per employee per SOP — re-sending refreshes context,
            // it never duplicates a row.
            $table->unique(['sop_id', 'user_id'], 'uq_sop_signoff');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sop_signoffs');
    }
};
