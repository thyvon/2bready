<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            // Nullable: existing seeded packages predate per-industry catalogs and
            // stay industry-agnostic (shown regardless of industry filter) until an
            // admin creates real industry-specific package rows. Industry is the top
            // -level partition — a package with an industry_id belongs to exactly
            // that industry's catalog, not a shared-with-override model.
            $table->char('industry_id', 26)->nullable()->after('id')->index();
            $table->foreign('industry_id')->references('id')->on('industries')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropForeign(['industry_id']);
            $table->dropColumn('industry_id');
        });
    }
};
