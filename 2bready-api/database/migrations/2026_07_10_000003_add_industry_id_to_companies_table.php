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
            // Nullable and additive on purpose — industry_code (the string column)
            // stays the API contract both wizards already send; this FK is resolved
            // server-side from that code (see IndustryResolver) so existing clients
            // don't need to change. Null just means the code didn't match a seeded
            // Industry row yet (legacy/test data), not an error.
            $table->char('industry_id', 26)->nullable()->after('industry_code')->index();
            $table->foreign('industry_id')->references('id')->on('industries')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropForeign(['industry_id']);
            $table->dropColumn('industry_id');
        });
    }
};
