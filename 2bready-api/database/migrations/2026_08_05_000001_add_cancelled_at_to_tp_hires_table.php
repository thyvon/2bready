<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Completion already records completed_at; cancellation needs its own
// timestamp so the cancel flow (Sprint 7 unhire) is auditable the same way.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tp_hires', function (Blueprint $table) {
            $table->timestamp('cancelled_at')->nullable()->after('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('tp_hires', function (Blueprint $table) {
            $table->dropColumn('cancelled_at');
        });
    }
};
