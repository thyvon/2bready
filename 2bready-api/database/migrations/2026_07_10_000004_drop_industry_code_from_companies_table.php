<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // industry_id (added in 2026_07_10_000003) becomes the sole source of
        // truth — no more parallel industry_code string that could drift out
        // of sync with the real Industry row. Dropped and re-added as
        // required rather than altered in place (no doctrine/dbal in this
        // project) — dev-stage data, not worth a careful backfill.
        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex(['country_code', 'industry_code']);
            $table->dropForeign(['industry_id']);
            $table->dropColumn(['industry_code', 'industry_id']);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->char('industry_id', 26)->after('id')->index();
            $table->foreign('industry_id')->references('id')->on('industries')->restrictOnDelete();
            $table->index(['country_code', 'industry_id']);
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex(['country_code', 'industry_id']);
            $table->dropForeign(['industry_id']);
            $table->dropColumn('industry_id');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->string('industry_code', 50)->after('id');
            $table->char('industry_id', 26)->nullable()->after('industry_code')->index();
            $table->foreign('industry_id')->references('id')->on('industries')->nullOnDelete();
            $table->index(['country_code', 'industry_code']);
        });
    }
};
