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
        // Backfill: every user who already had a single company_id becomes a
        // company_user membership row and keeps that company as their active one.
        $now = now();
        DB::table('users')
            ->whereNotNull('company_id')
            ->select('id', 'company_id')
            ->orderBy('id')
            ->each(function ($user) use ($now) {
                DB::table('company_user')->insert([
                    'user_id' => $user->id,
                    'company_id' => $user->company_id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('users')->where('id', $user->id)->update([
                    'current_company_id' => $user->company_id,
                ]);
            });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->char('company_id', 26)->nullable()->index();
        });

        DB::table('company_user')->orderBy('user_id')->each(function ($row) {
            DB::table('users')->where('id', $row->user_id)->update([
                'company_id' => $row->company_id,
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
        });
    }
};
