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
        Schema::create('packages', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('name');
            $table->string('name_kh')->nullable();
            $table->text('description')->nullable();
            $table->integer('price_cents');
            $table->string('billing_period', 20)->default('monthly');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('is_active');
        });

        DB::statement("ALTER TABLE packages ADD CONSTRAINT packages_billing_period_check CHECK (billing_period IN ('monthly','yearly','one_time'))");
        DB::statement('ALTER TABLE packages ADD CONSTRAINT packages_price_cents_check CHECK (price_cents >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
