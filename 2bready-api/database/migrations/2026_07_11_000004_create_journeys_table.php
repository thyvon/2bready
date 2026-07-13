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
        Schema::create('journeys', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('company_id', 26)->unique();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->char('journey_template_id', 26)->index();
            $table->foreign('journey_template_id')->references('id')->on('journey_templates')->restrictOnDelete();
            $table->string('status', 20)->default('active');
            $table->timestamp('activated_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        DB::statement("ALTER TABLE journeys ADD CONSTRAINT journeys_status_check CHECK (status IN ('active','completed'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('journeys');
    }
};
