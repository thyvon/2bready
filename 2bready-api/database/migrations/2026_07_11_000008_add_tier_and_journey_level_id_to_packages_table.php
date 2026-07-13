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
        Schema::table('packages', function (Blueprint $table) {
            $table->string('tier', 20)->default('free');
            $table->char('journey_level_id', 26)->nullable()->index();

            $table->foreign('journey_level_id')->references('id')->on('journey_levels')->nullOnDelete();
        });

        DB::statement("ALTER TABLE packages ADD CONSTRAINT packages_tier_check CHECK (tier IN ('free','pro','enterprise'))");
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropForeign(['journey_level_id']);
            $table->dropColumn(['tier', 'journey_level_id']);
        });
    }
};
