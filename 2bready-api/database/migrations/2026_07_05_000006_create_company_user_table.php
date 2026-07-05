<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Plain pivot table, composite primary key — no ULID id column, since this
        // row is never referenced by its own identity anywhere (no API resource
        // exposes a "company_user" record). Membership is written via attach()/
        // detach(), not Eloquent model events, so a ULID id would never get
        // populated by HasUlid anyway.
        Schema::create('company_user', function (Blueprint $table) {
            $table->char('user_id', 26);
            $table->char('company_id', 26);
            $table->timestamps();

            $table->primary(['user_id', 'company_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_user');
    }
};
