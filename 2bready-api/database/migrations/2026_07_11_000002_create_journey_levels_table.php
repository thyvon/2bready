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
        Schema::create('journey_levels', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('journey_template_id', 26)->index();
            $table->foreign('journey_template_id')->references('id')->on('journey_templates')->cascadeOnDelete();
            $table->string('code', 10);
            $table->string('name');
            $table->string('pathway_name');
            $table->string('pillar', 20);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['journey_template_id', 'code']);
        });

        DB::statement("ALTER TABLE journey_levels ADD CONSTRAINT journey_levels_pillar_check CHECK (pillar IN ('comply','scale','lead'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('journey_levels');
    }
};
