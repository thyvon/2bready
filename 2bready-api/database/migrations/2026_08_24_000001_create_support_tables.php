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
        Schema::create('support_tickets', function (Blueprint $table): void {
            $table->char('id', 26)->primary();
            $table->char('company_id', 26)->index();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->char('created_by', 26)->index();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
            // Nullable until an admin/staff member picks it up.
            $table->char('assigned_to', 26)->nullable()->index();
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
            $table->string('category', 30);
            $table->string('subject');
            $table->string('status', 20)->default('open')->index();
            $table->timestamps();
        });

        // Laravel's Blueprint has no check() — same raw-statement pattern as
        // the other status CHECK constraints in this codebase.
        DB::statement("ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_category_check CHECK (category IN ('general','billing','technical','consultation'))");
        DB::statement("ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_status_check CHECK (status IN ('open','pending','resolved','closed'))");

        Schema::create('support_ticket_messages', function (Blueprint $table): void {
            $table->char('id', 26)->primary();
            $table->char('support_ticket_id', 26)->index();
            $table->foreign('support_ticket_id')->references('id')->on('support_tickets')->cascadeOnDelete();
            $table->char('company_id', 26)->index();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->char('user_id', 26)->index();
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
            $table->text('message');
            $table->timestamps();

            $table->index(['support_ticket_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_ticket_messages');
        Schema::dropIfExists('support_tickets');
    }
};
