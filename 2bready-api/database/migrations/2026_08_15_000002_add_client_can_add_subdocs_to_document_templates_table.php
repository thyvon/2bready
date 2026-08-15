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
            // Whether the client (company) can add sub-documents (sub-taxonomy)
            // under this template themselves. When true, the client-portal
            // shows an "Add sub-document" action on this requirement.
            $table->boolean('client_can_add_subdocs')
                ->default(false)
                ->after('is_required');
        });
    }

    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropColumn('client_can_add_subdocs');
        });
    }
};