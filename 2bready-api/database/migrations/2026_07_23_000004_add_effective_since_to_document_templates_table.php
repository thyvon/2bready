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
            // When this specific requirement genuinely started applying —
            // independent of any one company's own compliance_start_date.
            // Null (the default) means "defer entirely to the company's own
            // anchor" — see ComplianceAnchorResolver. Only ever a floor: it
            // can push a template's anchor later than a company's compliance
            // start date, never earlier. Never queried/joined on — read once
            // per row in PHP — so no index.
            $table->date('effective_since')->nullable()->after('expiry_months');
        });
    }

    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropColumn('effective_since');
        });
    }
};
