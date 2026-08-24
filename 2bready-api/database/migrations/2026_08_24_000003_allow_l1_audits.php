<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // L1 is now an auditable tier (per-level certificates for L1-L4).
        DB::statement('ALTER TABLE audits DROP CONSTRAINT IF EXISTS audits_journey_level_check');
        DB::statement("ALTER TABLE audits ADD CONSTRAINT audits_journey_level_check CHECK (journey_level IN ('L1','L2','L3','L4'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE audits DROP CONSTRAINT IF EXISTS audits_journey_level_check');
        DB::statement("ALTER TABLE audits ADD CONSTRAINT audits_journey_level_check CHECK (journey_level IN ('L2','L3','L4'))");
    }
};
