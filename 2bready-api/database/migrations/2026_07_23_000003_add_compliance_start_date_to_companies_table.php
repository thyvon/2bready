<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            // When this company's compliance obligations actually began —
            // e.g. its incorporation date — independent of when it joined
            // 2bReady. Anchors BuildPeriodicHistoryAction's gap detection
            // (via JourneyController) so a company that existed years before
            // signing up sees its real missing periods, not just the ones
            // since journey.activated_at. Null means "use journey
            // activation," reproducing today's behavior exactly. Never
            // queried/joined on — read once per row in PHP — so no index.
            $table->date('compliance_start_date')->nullable()->after('registration_no');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn('compliance_start_date');
        });
    }
};
