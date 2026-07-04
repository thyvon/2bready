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
        Schema::create('payments', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('company_id', 26)->index();
            $table->char('subscription_id', 26)->index();
            $table->integer('amount_cents');
            $table->string('currency', 3)->default('USD');
            $table->string('method', 20);
            $table->string('status', 30)->default('pending');
            // Gateway/reference identifiers: Stripe payment intent id, or the reference
            // number a company is told to put on their bank transfer — one column, the
            // meaning depends on `method`.
            $table->string('gateway_reference')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->char('confirmed_by', 26)->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('subscription_id')->references('id')->on('subscriptions')->cascadeOnDelete();
            $table->foreign('confirmed_by')->references('id')->on('users')->nullOnDelete();
            $table->index('status');
            $table->index('method');
        });

        DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method IN ('stripe','manual_bank_transfer'))");
        DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending','awaiting_confirmation','confirmed','failed','rejected'))");
        DB::statement('ALTER TABLE payments ADD CONSTRAINT payments_amount_cents_check CHECK (amount_cents >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
