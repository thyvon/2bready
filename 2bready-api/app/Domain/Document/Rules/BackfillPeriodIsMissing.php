<?php

declare(strict_types=1);

namespace App\Domain\Document\Rules;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Actions\BuildPeriodicHistoryAction;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Document\Services\ComplianceAnchorResolver;
use App\Domain\Journey\Models\Journey;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Guards the one new degree of freedom this feature adds: an uploader
 * choosing which period a document is for, instead of it always being
 * "now." Without this, a company could claim any period_key at all — this
 * recomputes the real gap ledger (the same one the Journey page renders)
 * and only accepts a period that's a genuine, currently-missing slot for
 * this exact template+company, strictly before the current period (filing
 * the current period stays the existing plain upload flow, no period_key
 * needed).
 */
class BackfillPeriodIsMissing implements ValidationRule
{
    public function __construct(
        private readonly BuildPeriodicHistoryAction $buildPeriodicHistory,
        private readonly ComplianceAnchorResolver $anchorResolver,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        /** @var \Illuminate\Http\Request $request */
        $request = request();
        $template = DocumentTemplate::query()->find($request->input('document_template_id'));

        // Same resolution DocumentController::store uses — staff has no
        // current_company_id of their own and must say which company this
        // backfill is for explicitly.
        $companyId = $request->user()?->hasAnyRole(['admin', 'staff', 'finance'])
            ? $request->input('company_id')
            : $request->user()?->current_company_id;
        $company = Company::query()->find($companyId);

        if (! $template || ! $company) {
            $fail('The selected document could not be validated.');

            return;
        }

        if (! $template->recurrence_type->isPeriodic()) {
            $fail('This document does not support filing for a specific period.');

            return;
        }

        $journey = Journey::query()->where('company_id', $company->id)->first();
        $anchor = $this->anchorResolver->resolve($company, $journey, $template);

        $documents = Document::query()
            ->where('company_id', $company->id)
            ->where('document_template_id', $template->id)
            ->get();

        $history = $this->buildPeriodicHistory->execute($template->recurrence_type, $anchor, $documents);
        $entry = $history->first(fn ($entry) => $entry->periodKey === $value);

        if (! $entry || ! $entry->isMissing) {
            $fail('This period is not a missing filing for this document.');

            return;
        }

        if ($entry->isCurrent) {
            $fail('Use the regular upload action for the current period.');
        }
    }
}
