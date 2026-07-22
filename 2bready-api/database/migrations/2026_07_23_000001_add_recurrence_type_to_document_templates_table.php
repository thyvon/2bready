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
        Schema::table('document_templates', function (Blueprint $table) {
            // Replaces the implicit binary the old schema encoded (expiry_months
            // set = recurring, null = one-time) with a real recurrence concept.
            // expiry_months is kept — it remains the window length for the
            // 'rolling' type specifically.
            $table->string('recurrence_type', 20)->default('one_time')->after('is_required');
        });

        DB::statement("ALTER TABLE document_templates ADD CONSTRAINT document_templates_recurrence_type_check CHECK (recurrence_type IN ('one_time','rolling','periodic_monthly','periodic_annual'))");

        // Backfill: any template that already carried an expiry window was,
        // under the old model, a rolling re-verification requirement.
        // Periodic types are opted into deliberately (by an admin or the
        // seeder) — never guessed here, since monthly/annual can't be
        // inferred from a month count alone.
        DB::table('document_templates')
            ->whereNotNull('expiry_months')
            ->update(['recurrence_type' => 'rolling']);
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE document_templates DROP CONSTRAINT IF EXISTS document_templates_recurrence_type_check');

        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropColumn('recurrence_type');
        });
    }
};
