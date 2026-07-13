<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journey_templates', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('country_code', 2);
            $table->char('industry_id', 26)->index();
            $table->foreign('industry_id')->references('id')->on('industries')->restrictOnDelete();
            $table->string('name');
            $table->string('name_kh')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['country_code', 'industry_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journey_templates');
    }
};
