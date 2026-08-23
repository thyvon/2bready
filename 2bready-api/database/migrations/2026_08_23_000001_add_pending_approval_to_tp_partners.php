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
        // Sprint 7 approval flow: firms start pending_approval and only an
        // admin can promote them to active (or suspend them later).
        Schema::table('tp_partners', function (Blueprint $table): void {
            $table->string('status', 20)->default('pending_approval')->change();
        });

        DB::statement('ALTER TABLE tp_partners DROP CONSTRAINT IF EXISTS tp_partners_status_check');
        DB::statement("ALTER TABLE tp_partners ADD CONSTRAINT tp_partners_status_check CHECK (status IN ('pending_approval','active','suspended'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE tp_partners DROP CONSTRAINT IF EXISTS tp_partners_status_check');
        DB::statement("ALTER TABLE tp_partners ADD CONSTRAINT tp_partners_status_check CHECK (status IN ('active','suspended'))");

        Schema::table('tp_partners', function (Blueprint $table): void {
            $table->string('status', 20)->default('active')->change();
        });
    }
};
