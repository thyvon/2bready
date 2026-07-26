<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// A Payment used to belong to exactly one Subscription (a package purchase).
// TP-hire engagements are a second, structurally identical kind of payable —
// company pays, admin/finance confirms, something activates on confirm — so
// this generalizes to a polymorphic payable instead of forking a near-duplicate
// payments table. See RepositoryServiceProvider/AppServiceProvider's morph map
// registration for the short 'subscription'/'tp_hire' aliases stored here.
//
// Columns are added nullable and backfilled from the existing subscription_id
// before being locked to NOT NULL — this table already has real rows in
// production (unlike most of this app's other migrations, which can assume
// a fresh/reseeded database), so a straight `not_null` add would fail exactly
// like it did here: `column "payable_id" contains null values`.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->char('payable_id', 26)->nullable()->after('company_id');
            $table->string('payable_type')->nullable()->after('payable_id');
        });

        DB::statement("
            UPDATE payments
            SET payable_type = 'subscription', payable_id = subscription_id
            WHERE subscription_id IS NOT NULL
        ");

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['subscription_id']);
            $table->dropColumn('subscription_id');
        });

        DB::statement('ALTER TABLE payments ALTER COLUMN payable_id SET NOT NULL');
        DB::statement('ALTER TABLE payments ALTER COLUMN payable_type SET NOT NULL');

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['payable_type', 'payable_id']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['payments_payable_type_payable_id_index']);
            $table->dropColumn(['payable_id', 'payable_type']);

            $table->char('subscription_id', 26)->after('company_id');
            $table->foreign('subscription_id')->references('id')->on('subscriptions')->cascadeOnDelete();
        });
    }
};
