<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\DTOs\PeriodHistoryEntry;
use App\Domain\Document\Enums\RecurrenceType;
use App\Domain\Document\Models\Document;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Turns a template's raw Document rows into a full period ledger — every
 * calendar slot the template has owed since $anchor through the current
 * period, each either backed by a real Document or marked missing. This is
 * the piece a flat "past uploads" list can never express: a period with no
 * document at all has no row to show, so the gap has to be computed by
 * diffing "owed" (RecurrenceType::periodKeysSince) against "filed" (the
 * distinct period_key values actually present), not read off a query.
 *
 * Only meaningful for periodic recurrence types — callers should keep using
 * the existing flat history list for rolling/one-time templates, which have
 * no calendar slot to be missing from.
 */
class BuildPeriodicHistoryAction
{
    /**
     * @param  Collection<int, Document>  $documents  every document for one template+company, any order
     * @return Collection<int, PeriodHistoryEntry> newest period first
     */
    public function execute(RecurrenceType $recurrence, CarbonInterface $anchor, Collection $documents): Collection
    {
        $now = now();
        $currentPeriodKey = $recurrence->periodKeyFor($now);

        // Newest document per period wins a slot (a rejected-then-verified
        // resubmission in the same period should show the resubmission, not
        // the rejection) — $documents isn't guaranteed pre-sorted, so sort
        // explicitly by id (ULID, monotonic) rather than assuming caller
        // order. Ascending, not descending: keyBy() keeps the LAST item it
        // sees for a duplicate key, so ascending order (oldest → newest)
        // means the newest one wins the slot.
        $documentByPeriod = $documents
            ->whereNotNull('period_key')
            ->sortBy('id')
            ->keyBy('period_key');

        // "Owed" periods (for gap detection) PLUS any period that actually
        // has a document, regardless of the anchor — a real historical
        // filing must never silently disappear just because it predates
        // where "missing" enumeration starts (e.g. a template re-created or
        // re-seeded after documents already existed against it). The anchor
        // only decides how far back a MISSING gap is worth reporting, never
        // whether a real upload gets shown.
        $periodKeys = collect($recurrence->periodKeysSince($anchor, $now))
            ->merge($documentByPeriod->keys())
            ->unique()
            ->sort() // period keys are zero-padded ("2026-07" / "2026"), so lexicographic sort is chronological
            ->values();

        return $periodKeys
            ->reverse()
            ->values()
            ->map(fn (string $periodKey) => new PeriodHistoryEntry(
                document: $documentByPeriod->get($periodKey),
                periodKey: $periodKey,
                isMissing: ! $documentByPeriod->has($periodKey),
                isCurrent: $periodKey === $currentPeriodKey,
            ));
    }
}
