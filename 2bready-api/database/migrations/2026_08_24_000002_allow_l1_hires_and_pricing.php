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
        // L1 became a fully auditable paid tier (per-level certificates for
        // L1-L4) — firms can price it and be hired for it like any other.
        Schema::table('tp_partners', function (Blueprint $table): void {
            $table->integer('price_l1_cents')->nullable()->after('price_l4_cents');
        });

        DB::statement('ALTER TABLE tp_hires DROP CONSTRAINT IF EXISTS tp_hires_journey_level_check');
        DB::statement("ALTER TABLE tp_hires ADD CONSTRAINT tp_hires_journey_level_check CHECK (journey_level IN ('L1','L2','L3','L4'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE tp_hires DROP CONSTRAINT IF EXISTS tp_hires_journey_level_check');
        DB::statement("ALTER TABLE tp_hires ADD CONSTRAINT tp_hires_journey_level_check CHECK (journey_level IN ('L2','L3','L4'))");

        Schema::table('tp_partners', function (Blueprint $table): void {
            $table->dropColumn('price_l1_cents');
        });
    }
};
