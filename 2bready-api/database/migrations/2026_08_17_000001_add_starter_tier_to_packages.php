<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// The platform's L1 journey level is now a paid "Starter" tier (like L2–L4),
// so the packages.tier CHECK constraint must accept it. The `free` tier value
// stays valid (nothing gates on it anymore, but dropping it would break any
// package rows still carrying it).
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE packages DROP CONSTRAINT packages_tier_check');
        DB::statement("ALTER TABLE packages ADD CONSTRAINT packages_tier_check CHECK (tier IN ('free','starter','pro','enterprise'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE packages DROP CONSTRAINT packages_tier_check');
        DB::statement("ALTER TABLE packages ADD CONSTRAINT packages_tier_check CHECK (tier IN ('free','pro','enterprise'))");
    }
};
