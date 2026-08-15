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
            // The third-party audit firm's (TP partner) charge for the manual
            // audit at this level. A package maps 1:1 to a journey level, and
            // a TP hire is per level — so the fee is a package/level attribute,
            // shared by the monthly + yearly rows. Public landing pricing shows
            // it as the "+ $XX manual audit fee" line.
            $table->integer('audit_fee_cents')->default(0)->after('price_cents');
        });

        DB::statement('ALTER TABLE packages ADD CONSTRAINT packages_audit_fee_cents_check CHECK (audit_fee_cents >= 0)');
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn('audit_fee_cents');
        });
    }
};
