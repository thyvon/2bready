<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('signoff_documents', function (Blueprint $table) {
            $table->char('document_id', 26)->nullable()->after('company_id');
            $table->foreign('document_id')->references('id')->on('documents')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('signoff_documents', function (Blueprint $table) {
            $table->dropForeign(['document_id']);
            $table->dropColumn('document_id');
        });
    }
};
