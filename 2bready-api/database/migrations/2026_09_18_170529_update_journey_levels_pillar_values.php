<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE journey_levels DROP CONSTRAINT IF EXISTS journey_levels_pillar_check');
        DB::statement("UPDATE journey_levels SET pillar = 'verify' WHERE pillar = 'comply'");
        DB::statement("UPDATE journey_levels SET pillar = 'connect' WHERE pillar = 'scale'");
        DB::statement("UPDATE journey_levels SET pillar = 'grow' WHERE pillar = 'lead'");
        DB::statement("ALTER TABLE journey_levels ADD CONSTRAINT journey_levels_pillar_check CHECK (pillar IN ('verify','connect','grow'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE journey_levels DROP CONSTRAINT IF EXISTS journey_levels_pillar_check');
        DB::statement("UPDATE journey_levels SET pillar = 'comply' WHERE pillar = 'verify'");
        DB::statement("UPDATE journey_levels SET pillar = 'scale' WHERE pillar = 'connect'");
        DB::statement("UPDATE journey_levels SET pillar = 'lead' WHERE pillar = 'grow'");
        DB::statement("ALTER TABLE journey_levels ADD CONSTRAINT journey_levels_pillar_check CHECK (pillar IN ('comply','scale','lead'))");
    }
};
