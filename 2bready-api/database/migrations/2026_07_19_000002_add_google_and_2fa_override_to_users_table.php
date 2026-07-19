<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('email');
            $table->boolean('google_auth_enabled')->default(false)->after('google_id');
            // Tri-state override of User::requiresTwoFactor()'s role-derived default —
            // null keeps that default, true/false forces the requirement either way
            // regardless of role. See User::requiresTwoFactor().
            $table->boolean('two_factor_required')->nullable()->after('two_factor_confirmed_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'google_auth_enabled', 'two_factor_required']);
        });
    }
};
