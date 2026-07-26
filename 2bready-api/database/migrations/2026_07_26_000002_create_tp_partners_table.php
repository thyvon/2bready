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
        Schema::create('tp_partners', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('name');
            $table->string('name_kh')->nullable();
            $table->string('status', 20)->default('active');
            // Per-level pricing, snapshotted into TpHire.price_agreed_cents at
            // hire time — a later change here never retroactively affects an
            // existing hire (mirrors packages.price_cents/Subscription's
            // snapshot pattern).
            $table->integer('price_l2_cents')->nullable();
            $table->integer('price_l3_cents')->nullable();
            $table->integer('price_l4_cents')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });

        DB::statement("ALTER TABLE tp_partners ADD CONSTRAINT tp_partners_status_check CHECK (status IN ('active','suspended'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('tp_partners');
    }
};
