<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Accountability parity with the existing verified_by_user_id — matters more
// once a TP (not just internal staff) can reject a document.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->char('rejected_by_user_id', 26)->nullable()->after('rejection_reason');
            $table->foreign('rejected_by_user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['rejected_by_user_id']);
            $table->dropColumn('rejected_by_user_id');
        });
    }
};
