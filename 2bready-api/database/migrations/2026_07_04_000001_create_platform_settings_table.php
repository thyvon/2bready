<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('key')->unique();
            $table->json('value');
            $table->string('group', 50)->default('general');
            $table->char('updated_by', 26)->nullable();
            $table->timestamps();

            $table->index('group');
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
