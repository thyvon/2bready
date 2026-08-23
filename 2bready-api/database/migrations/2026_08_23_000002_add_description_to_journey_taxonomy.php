<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Short bilingual-ready copy for tooltips on the landing pricing cards
        // and anywhere else the taxonomy renders (public /pricing payload).
        Schema::table('journey_levels', function (Blueprint $table): void {
            $table->text('description')->nullable()->after('pathway_name');
        });

        Schema::table('milestones', function (Blueprint $table): void {
            $table->text('description')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('journey_levels', function (Blueprint $table): void {
            $table->dropColumn('description');
        });

        Schema::table('milestones', function (Blueprint $table): void {
            $table->dropColumn('description');
        });
    }
};
