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
        Schema::create('companies', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('name');
            $table->string('name_kh')->nullable();
            $table->string('registration_no')->nullable();
            $table->integer('employee_count')->nullable();
            $table->json('bypass_flags')->default('{}');
            $table->string('industry_code', 50);
            $table->string('country_code', 2)->default('KH');
            $table->string('status', 20)->default('active');
            $table->integer('compliance_score')->default(0);
            $table->string('default_locale', 5)->default('en');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index(['country_code', 'industry_code']);
        });

        DB::statement("ALTER TABLE companies ADD CONSTRAINT companies_status_check CHECK (status IN ('active','suspended','inactive'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
