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
        // industry_id (added in 2026_07_10_000003) becomes the sole source of
        // truth — no more parallel industry_code string that could drift out
        // of sync with the real Industry row. The column itself is kept (not
        // dropped/re-added) so any already-backfilled values survive; NOT
        // NULL is enforced via raw SQL afterward since Blueprint::change()
        // needs doctrine/dbal, which this project doesn't have.
        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex(['country_code', 'industry_code']);
            $table->dropForeign(['industry_id']);
            $table->dropColumn('industry_code');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->foreign('industry_id')->references('id')->on('industries')->restrictOnDelete();
            $table->index(['country_code', 'industry_id']);
        });

        DB::statement('ALTER TABLE companies ALTER COLUMN industry_id SET NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE companies ALTER COLUMN industry_id DROP NOT NULL');

        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex(['country_code', 'industry_id']);
            $table->dropForeign(['industry_id']);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->string('industry_code', 50)->after('id');
            $table->foreign('industry_id')->references('id')->on('industries')->nullOnDelete();
            $table->index(['country_code', 'industry_code']);
        });
    }
};
