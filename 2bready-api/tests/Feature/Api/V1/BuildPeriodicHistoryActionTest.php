<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Document\Actions\BuildPeriodicHistoryAction;
use App\Domain\Document\DTOs\PeriodHistoryEntry;
use App\Domain\Document\Enums\RecurrenceType;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->template = DocumentTemplate::factory()->create(['recurrence_type' => 'periodic_annual']);
    $this->action = app(BuildPeriodicHistoryAction::class);
});

function periodicDoc(string $companyId, string $templateId, string $periodKey, string $status = 'verified'): Document
{
    return Document::factory()->create([
        'company_id' => $companyId,
        'document_template_id' => $templateId,
        'period_key' => $periodKey,
        'status' => $status,
    ]);
}

it('marks every period as filed when every period has a document', function () {
    $doc2024 = periodicDoc($this->company->id, $this->template->id, '2024');
    $doc2025 = periodicDoc($this->company->id, $this->template->id, '2025');
    $doc2026 = periodicDoc($this->company->id, $this->template->id, '2026');

    $ledger = $this->action->execute(
        RecurrenceType::PeriodicAnnual,
        Carbon::parse('2024-01-01'),
        collect([$doc2024, $doc2025, $doc2026]),
    );

    expect($ledger->pluck('periodKey')->all())->toBe(['2026', '2025', '2024']);
    expect($ledger->every(fn (PeriodHistoryEntry $entry) => ! $entry->isMissing))->toBeTrue();
    expect($ledger->firstWhere('periodKey', '2026')->isCurrent)->toBeTrue();
    expect($ledger->firstWhere('periodKey', '2026')->document->is($doc2026))->toBeTrue();
    expect($ledger->firstWhere('periodKey', '2025')->isCurrent)->toBeFalse();
});

it('surfaces a real gap for a period with no document at all', function () {
    $doc2024 = periodicDoc($this->company->id, $this->template->id, '2024');
    $doc2026 = periodicDoc($this->company->id, $this->template->id, '2026');
    // 2025 deliberately has no Document row.

    $ledger = $this->action->execute(
        RecurrenceType::PeriodicAnnual,
        Carbon::parse('2024-01-01'),
        collect([$doc2024, $doc2026]),
    );

    expect($ledger->pluck('periodKey')->all())->toBe(['2026', '2025', '2024']);

    $missing = $ledger->firstWhere('periodKey', '2025');
    expect($missing->isMissing)->toBeTrue();
    expect($missing->document)->toBeNull();
    expect($missing->isCurrent)->toBeFalse();
});

it('marks the current period missing when nothing has been uploaded for it yet', function () {
    $doc2024 = periodicDoc($this->company->id, $this->template->id, '2024');

    $ledger = $this->action->execute(
        RecurrenceType::PeriodicAnnual,
        Carbon::parse('2024-01-01'),
        collect([$doc2024]),
    );

    $current = $ledger->firstWhere('isCurrent', true);
    expect($current->periodKey)->toBe('2026');
    expect($current->isMissing)->toBeTrue();
});

it('returns an empty ledger when there are no documents and the anchor is the current period', function () {
    $ledger = $this->action->execute(
        RecurrenceType::PeriodicAnnual,
        now(),
        collect(),
    );

    expect($ledger)->toHaveCount(1);
    expect($ledger->first()->periodKey)->toBe(now()->format('Y'));
    expect($ledger->first()->isMissing)->toBeTrue();
});

it('prefers the newest document when more than one filing exists for the same period', function () {
    $rejected = periodicDoc($this->company->id, $this->template->id, '2026', 'rejected');
    $verified = periodicDoc($this->company->id, $this->template->id, '2026', 'verified');

    $ledger = $this->action->execute(
        RecurrenceType::PeriodicAnnual,
        Carbon::parse('2026-01-01'),
        collect([$rejected, $verified]),
    );

    $current = $ledger->firstWhere('periodKey', '2026');
    expect($current->document->is($verified))->toBeTrue();
});

it('never drops a real document even when its period predates the anchor', function () {
    // A document genuinely exists for 2020, but the anchor (e.g. the
    // template's own creation date) starts at 2024 — the 2020 filing must
    // still appear; only "missing" gap detection is anchor-bound, not real
    // uploads.
    $doc2020 = periodicDoc($this->company->id, $this->template->id, '2020');
    $doc2026 = periodicDoc($this->company->id, $this->template->id, '2026');

    $ledger = $this->action->execute(
        RecurrenceType::PeriodicAnnual,
        Carbon::parse('2024-01-01'),
        collect([$doc2020, $doc2026]),
    );

    // 2020 (real, pre-anchor) + 2026 (current) + 2024/2025 (missing, inside the anchor window).
    expect($ledger->pluck('periodKey')->all())->toBe(['2026', '2025', '2024', '2020']);
    expect($ledger->firstWhere('periodKey', '2020')->isMissing)->toBeFalse();
    expect($ledger->firstWhere('periodKey', '2020')->document->is($doc2020))->toBeTrue();
});

it('enumerates month-by-month for a periodic_monthly recurrence', function () {
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->template->id,
        'period_key' => now()->format('Y-m'),
        'status' => 'verified',
    ]);

    $ledger = $this->action->execute(
        RecurrenceType::PeriodicMonthly,
        now()->subMonths(2),
        collect([$document]),
    );

    expect($ledger)->toHaveCount(3);
    expect($ledger->first()->periodKey)->toBe(now()->format('Y-m'));
    expect($ledger->first()->isMissing)->toBeFalse();
    expect($ledger->last()->isMissing)->toBeTrue();
});
