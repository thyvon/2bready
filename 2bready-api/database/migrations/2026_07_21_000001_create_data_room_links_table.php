<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_room_links', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('company_id', 26);
            $table->char('created_by', 26);
            // Random URL-safe slug — this IS the secret alongside the PIN,
            // never log it (see CLAUDE.md's key data relationships note).
            $table->string('token', 64)->unique();
            // Nullable to match the ERD, but CreateDataRoomLinkAction always
            // generates one — a data room is never shared without a PIN.
            $table->string('pin_hash')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->index('company_id');
            $table->index('expires_at');

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_room_links');
    }
};
