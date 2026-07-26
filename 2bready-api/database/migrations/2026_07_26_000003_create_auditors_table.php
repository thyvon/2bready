<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Profile table, per the backend's own documented Rule #4: auditors
// authenticate through the standard `users` table with the `auditor` role —
// this table only holds the TP-specific profile fields, never credentials.
// Single `tp_partner_id` FK (not a pivot) — one auditor works for one firm in
// v1; see BelongsToTpPartner's absence note for the future-pivot precedent
// (users.company_id -> company_user) if that ever needs to change.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auditors', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('user_id', 26)->unique();
            $table->char('tp_partner_id', 26)->index();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('tp_partner_id')->references('id')->on('tp_partners')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditors');
    }
};
