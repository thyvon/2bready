// Matches App\Domain\Document\Enums\RecurrenceType's real backed values —
// unlike phase 1's ExpiryPreset (permanent/monthly/annually/custom, derived
// from a bare expiry_months number), recurrence_type is now a real stored
// column, so this is just the fixed set of valid values, not a derivation.
export type RecurrenceKind = 'one_time' | 'rolling' | 'periodic_monthly' | 'periodic_annual';

export const RECURRENCE_KINDS: RecurrenceKind[] = ['one_time', 'rolling', 'periodic_monthly', 'periodic_annual'];

// Only 'rolling' has an admin-configurable window — periodic cadences are
// fixed (exactly one calendar month/year) and one_time never expires.
export function recurrenceKindNeedsMonths(kind: RecurrenceKind): boolean {
  return kind === 'rolling';
}
