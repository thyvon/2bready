<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // The compliance period this filing covers — "2026-07" (monthly)
            // or "2026" (annual). Null for one-time and rolling documents,
            // whose standing is decided by the latest upload alone, not by
            // slot. Set at verification time by VerifyDocumentAction from the
            // template's recurrence_type. A plain string, not a date: an
            // annual key has no month/day and a monthly key has no day, so a
            // real DATE column would force meaningless precision.
            $table->string('period_key', 7)->nullable()->after('status');

            // Set the first time SendDocumentExpiryRemindersJob warns about
            // this document, so a job that runs daily doesn't re-send the
            // same reminder every day of the reminder window. A fresh
            // re-upload is a new row, so it starts null again automatically.
            $table->timestamp('expiry_reminded_at')->nullable()->after('expires_at');

            // Drives BuildPeriodicHistoryAction's "which periods are filed /
            // missing" diff and the reminder job's "already reminded" check —
            // both query by exactly this tuple.
            $table->index(['company_id', 'document_template_id', 'period_key']);
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['company_id', 'document_template_id', 'period_key']);
            $table->dropColumn(['period_key', 'expiry_reminded_at']);
        });
    }
};
