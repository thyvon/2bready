<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// One rating per completed hire — the company's verdict on the firm's work
// at the end of an engagement (Sprint 7, Marketplace domain). Aggregates
// (average + count) are computed on read via withAvg/withCount, never stored
// on tp_partners, so there is no denormalized number to drift out of sync.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tp_ratings', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('tp_hire_id', 26)->unique();
            $table->char('company_id', 26)->index();
            $table->char('tp_partner_id', 26)->index();
            $table->smallInteger('rating'); // 1..5
            $table->text('review_text')->nullable();
            $table->char('created_by_user_id', 26)->nullable();
            $table->timestamps();

            $table->foreign('tp_hire_id')->references('id')->on('tp_hires')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('tp_partner_id')->references('id')->on('tp_partners')->restrictOnDelete();
            $table->foreign('created_by_user_id')->references('id')->on('users')->nullOnDelete();

            // The marketplace listing's per-firm aggregate query.
            $table->index(['tp_partner_id', 'rating']);
        });

        DB::statement('ALTER TABLE tp_ratings ADD CONSTRAINT tp_ratings_rating_check CHECK (rating BETWEEN 1 AND 5)');
    }

    public function down(): void
    {
        Schema::dropIfExists('tp_ratings');
    }
};
