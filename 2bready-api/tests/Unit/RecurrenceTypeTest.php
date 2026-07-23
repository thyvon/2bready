<?php

declare(strict_types=1);

use App\Domain\Document\Enums\RecurrenceType;
use Carbon\Carbon;

it('produces a period key only for periodic types', function () {
    $date = Carbon::parse('2026-07-15');

    expect(RecurrenceType::OneTime->periodKeyFor($date))->toBeNull()
        ->and(RecurrenceType::Rolling->periodKeyFor($date))->toBeNull()
        ->and(RecurrenceType::PeriodicMonthly->periodKeyFor($date))->toBe('2026-07')
        ->and(RecurrenceType::PeriodicAnnual->periodKeyFor($date))->toBe('2026');
});

it('reports which types are periodic', function () {
    expect(RecurrenceType::OneTime->isPeriodic())->toBeFalse()
        ->and(RecurrenceType::Rolling->isPeriodic())->toBeFalse()
        ->and(RecurrenceType::PeriodicMonthly->isPeriodic())->toBeTrue()
        ->and(RecurrenceType::PeriodicAnnual->isPeriodic())->toBeTrue();
});

it('never expires a one-time document', function () {
    expect(RecurrenceType::OneTime->expiresAtFor(now(), 12))->toBeNull();
});

it('uses the template window for rolling expiry', function () {
    $date = Carbon::parse('2026-01-10');

    expect(RecurrenceType::Rolling->expiresAtFor($date, 6)->toDateString())
        ->toBe('2026-07-10');
});

it('has no rolling expiry without a window', function () {
    expect(RecurrenceType::Rolling->expiresAtFor(now(), null))->toBeNull();
});

it('expires periodic documents at the next period boundary regardless of filing date', function () {
    $date = Carbon::parse('2026-07-15');

    expect(RecurrenceType::PeriodicMonthly->expiresAtFor($date, null)->toDateString())
        ->toBe('2026-08-01')
        ->and(RecurrenceType::PeriodicAnnual->expiresAtFor($date, null)->toDateString())
        ->toBe('2027-01-01');
});

it('enumerates every annual period key between two dates, inclusive, oldest first', function () {
    $since = Carbon::parse('2023-03-01');
    $until = Carbon::parse('2026-07-15');

    expect(RecurrenceType::PeriodicAnnual->periodKeysSince($since, $until))
        ->toBe(['2023', '2024', '2025', '2026']);
});

it('enumerates every monthly period key between two dates, inclusive, oldest first', function () {
    $since = Carbon::parse('2026-04-20');
    $until = Carbon::parse('2026-07-05');

    expect(RecurrenceType::PeriodicMonthly->periodKeysSince($since, $until))
        ->toBe(['2026-04', '2026-05', '2026-06', '2026-07']);
});

it('enumerates no period keys for non-periodic types', function () {
    $since = Carbon::parse('2023-01-01');
    $until = Carbon::parse('2026-01-01');

    expect(RecurrenceType::OneTime->periodKeysSince($since, $until))->toBe([])
        ->and(RecurrenceType::Rolling->periodKeysSince($since, $until))->toBe([]);
});

it('resolves a backfilled period to its own calendar start, not now', function () {
    expect(RecurrenceType::PeriodicAnnual->referenceDateForPeriod('2023')->toDateString())
        ->toBe('2023-01-01')
        ->and(RecurrenceType::PeriodicMonthly->referenceDateForPeriod('2023-06')->toDateString())
        ->toBe('2023-06-01');
});

it('computes a historically-correct expiry for a backfilled period', function () {
    // A document filed today for 2023 must expire at the 2023 calendar
    // boundary (Jan 1, 2024), not one year from today.
    $reference = RecurrenceType::PeriodicAnnual->referenceDateForPeriod('2023');

    expect(RecurrenceType::PeriodicAnnual->expiresAtFor($reference, null)->toDateString())
        ->toBe('2024-01-01');
});
