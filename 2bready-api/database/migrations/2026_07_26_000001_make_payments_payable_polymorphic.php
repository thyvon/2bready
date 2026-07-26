<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A Payment used to belong to exactly one Subscription (a package purchase).
// TP-hire engagements are a second, structurally identical kind of payable —
// company pays, admin/finance confirms, something activates on confirm — so
// this generalizes to a polymorphic payable instead of forking a near-duplicate
// payments table. See RepositoryServiceProvider/AppServiceProvider's morph map
// registration for the short 'subscription'/'tp_hire' aliases stored here.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['subscription_id']);
            $table->dropColumn('subscription_id');

            $table->char('payable_id', 26)->after('company_id');
            $table->string('payable_type')->after('payable_id');
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
