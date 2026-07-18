<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            // Self-referencing — lets a document template have sub-document
            // templates, to any depth. Root-level rows keep parent_id null.
            $table->char('parent_id', 26)->nullable()->index()->after('milestone_id');
            $table->foreign('parent_id')->references('id')->on('document_templates')->cascadeOnDelete();

            // Null = part of the shared taxonomy, visible to every company on
            // this journey. Set = an extra requirement for that one company
            // only, added by staff from the company's own Journey tab.
            $table->char('company_id', 26)->nullable()->index()->after('parent_id');
            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropForeign(['company_id']);
            $table->dropColumn(['parent_id', 'company_id']);
        });
    }
};
