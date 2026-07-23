<?php

declare(strict_types=1);

namespace App\Domain\Document\Enums;

use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * How a document requirement recurs — the distinction `expiry_months` alone
 * couldn't express: a fixed calendar slot (periodic) vs. a rolling validity
 * window vs. never.
 *
 * - OneTime         proves something that stays true once verified (MoC
 *                   Registration, Shareholder ID). Never expires, no period.
 * - Rolling         valid for a fixed window from the verification date; any
 *                   upload newer than `expiry_months` months is acceptable
 *                   (Lab CoA, CBC Credit Reports). No calendar slot, so there
 *                   is no such thing as a "missing" rolling period — only
 *                   "is there a currently-valid upload."
 * - PeriodicMonthly one filing owed per calendar month. Each verified upload
 *                   satisfies exactly one `period_key` ("2026-07"); a month
 *                   with no upload at all is a real, visible gap.
 * - PeriodicAnnual  one filing owed per calendar year ("2026") — Annual
 *                   Patent Tax, Hygiene/ISO certificates, audited financials.
 */
enum RecurrenceType: string
{
    case OneTime = 'one_time';
    case Rolling = 'rolling';
    case PeriodicMonthly = 'periodic_monthly';
    case PeriodicAnnual = 'periodic_annual';

    /**
     * Periodic types are tracked slot-by-slot (period_key) and can have a
     * missing slot; one-time and rolling are not — the latest upload alone
     * determines standing.
     */
    public function isPeriodic(): bool
    {
        return $this === self::PeriodicMonthly || $this === self::PeriodicAnnual;
    }

    /**
     * The compliance period a filing verified on $date covers, or null for
     * non-periodic types. Monthly → "YYYY-MM", annual → "YYYY".
     */
    public function periodKeyFor(CarbonInterface $date): ?string
    {
        return match ($this) {
            self::PeriodicMonthly => $date->format('Y-m'),
            self::PeriodicAnnual => $date->format('Y'),
            default => null,
        };
    }

    /**
     * When a filing verified on $date stops covering the requirement, or
     * null if it never expires (OneTime). Rolling uses the template's own
     * `expiry_months`; periodic types expire at their period's calendar
     * boundary regardless of how early in the period they were filed.
     */
    public function expiresAtFor(CarbonInterface $date, ?int $expiryMonths): ?CarbonInterface
    {
        return match ($this) {
            self::OneTime => null,
            self::Rolling => $expiryMonths ? $date->copy()->addMonths($expiryMonths) : null,
            self::PeriodicMonthly => $date->copy()->addMonthNoOverflow()->startOfMonth(),
            self::PeriodicAnnual => $date->copy()->addYear()->startOfYear(),
        };
    }

    /**
     * Every period key this recurrence type owes between $since and $until,
     * inclusive of both, oldest first. Only meaningful for periodic types —
     * used by BuildPeriodicHistoryAction to diff "owed" against "filed" and
     * surface a genuinely missing period, not just an absent row.
     *
     * @return array<int, string>
     */
    public function periodKeysSince(CarbonInterface $since, CarbonInterface $until): array
    {
        if (! $this->isPeriodic() || $since->greaterThan($until)) {
            return [];
        }

        // Compares by period-key equality, not by date, and stops the moment
        // the cursor's key matches $until's key — comparing raw dates would
        // let $since's original day-of-month drift the cursor past $until
        // before it ever reaches $until's actual period (e.g. since = Apr 20,
        // until = Jul 5: the cursor would hit Jul 20 > Jul 5 and stop one
        // period short, silently dropping July).
        $keys = [];
        $cursor = $since->copy();
        $untilKey = $this->periodKeyFor($until);

        while (true) {
            $key = $this->periodKeyFor($cursor);
            $keys[] = $key;

            if ($key === $untilKey) {
                break;
            }

            $cursor = $this === self::PeriodicMonthly
                ? $cursor->addMonthNoOverflow()
                : $cursor->addYear();
        }

        return $keys;
    }

    /**
     * The reference date a backfilled document's expiry must be computed
     * from — its own period's calendar start, not "now." Without this, a
     * document filed today for 2023 would get an expiry one year from
     * today instead of Jan 1, 2024, silently misrepresenting when a
     * historical filing actually lapsed.
     */
    public function referenceDateForPeriod(string $periodKey): CarbonInterface
    {
        return match ($this) {
            self::PeriodicMonthly => Carbon::createFromFormat('Y-m', $periodKey)->startOfMonth(),
            self::PeriodicAnnual => Carbon::createFromFormat('Y', $periodKey)->startOfYear(),
            default => now(),
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::OneTime => 'One-time',
            self::Rolling => 'Rolling validity',
            self::PeriodicMonthly => 'Monthly filing',
            self::PeriodicAnnual => 'Annual filing',
        };
    }
}
