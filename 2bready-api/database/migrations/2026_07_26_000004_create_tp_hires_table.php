<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// The paid engagement — a company hires a TpPartner to review its documents
// at a given journey level. Column shape (status, assigned_by_user_id
// nullable, hired_at/completed_at) is deliberately the same one a future
// company-initiated self-service hire would populate, so the Sprint 7
// marketplace needs a new Action, not a schema migration.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tp_hires', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('company_id', 26)->index();
            $table->char('tp_partner_id', 26)->index();
            $table->string('journey_level', 10); // 'L2' | 'L3' | 'L4'

            // Snapshotted at hire-creation time from tp_partners.price_lX —
            // never recalculated, so a later firm price change doesn't
            // retroactively change an existing hire's cost.
            $table->integer('price_agreed_cents');
            $table->integer('platform_commission_cents');
            $table->integer('tp_payout_cents');

            $table->string('status', 20)->default('pending_payment');
            $table->string('payout_status', 20)->default('unpaid');

            // Who on 2bReady's side created this hire — nullable so a future
            // company-initiated self-service hire (no admin involved) can use
            // the same row shape.
            $table->char('assigned_by_user_id', 26)->nullable();
            $table->char('payout_confirmed_by', 26)->nullable();
            $table->timestamp('payout_confirmed_at')->nullable();

            $table->timestamp('hired_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('tp_partner_id')->references('id')->on('tp_partners')->restrictOnDelete();
            $table->foreign('assigned_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('payout_confirmed_by')->references('id')->on('users')->nullOnDelete();

            $table->index('status');
            // The exact lookup DocumentPolicy::manage() does for every
            // verify/reject call — an assigned TP's active engagement for one
            // company.
            $table->index(['tp_partner_id', 'company_id', 'status']);
        });

        DB::statement("ALTER TABLE tp_hires ADD CONSTRAINT tp_hires_journey_level_check CHECK (journey_level IN ('L2','L3','L4'))");
        DB::statement("ALTER TABLE tp_hires ADD CONSTRAINT tp_hires_status_check CHECK (status IN ('pending_payment','active','completed','cancelled'))");
        DB::statement("ALTER TABLE tp_hires ADD CONSTRAINT tp_hires_payout_status_check CHECK (payout_status IN ('unpaid','paid_out'))");
        DB::statement('ALTER TABLE tp_hires ADD CONSTRAINT tp_hires_price_agreed_cents_check CHECK (price_agreed_cents >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('tp_hires');
    }
};
