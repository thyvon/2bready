<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Enums\DocumentStatus;
use App\Domain\Document\Models\Document;
use Illuminate\Support\Collection;

/**
 * Lists verified journey documents that are eligible for signoff.
 * Excludes documents already linked to a signoff_document record (i.e.
 * already sent or pending review) so the owner only sees fresh candidates.
 */
class ListVerifiedJourneyDocumentsAction
{
    /** @return Collection<int, Document> */
    public function execute(Company $company): Collection
    {
        $alreadyLinkedSignoffDocIds = \DB::table('signoff_documents')
            ->where('company_id', $company->id)
            ->whereNotNull('document_id')
            ->pluck('document_id');

        return Document::query()
            ->withoutGlobalScope('company')
            ->where('company_id', $company->id)
            ->where('status', DocumentStatus::Verified)
            ->whereNotIn('id', $alreadyLinkedSignoffDocIds)
            ->with(['documentTemplate'])
            ->latest('verified_at')
            ->get();
    }
}
