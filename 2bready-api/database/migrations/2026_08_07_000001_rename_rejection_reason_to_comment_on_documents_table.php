<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Rejection-only naming was narrower than reality: the field is now written
// by every review action (verify + reject) as a reviewer comment/reason, not
// just on rejection. Renamed to plain `comment` to match.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->renameColumn('rejection_reason', 'comment');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->renameColumn('comment', 'rejection_reason');
        });
    }
};
