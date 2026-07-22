<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Document\DTOs\PeriodHistoryEntry;
use App\Domain\Document\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One entry in a checklist item's history — either a real past upload
 * (rejected attempt, expired rolling window) or, for a periodic
 * (monthly/annual) requirement, a calendar period with NO upload at all
 * (`is_missing`). A missing period has no Document behind it, so $document
 * is genuinely nullable here.
 *
 * Wraps the (never-null) PeriodHistoryEntry as `$resource` — NOT the
 * possibly-null Document — because JsonResource has a built-in behaviour
 * where a resource whose wrapped `$resource` is `null` collapses to a bare
 * `null` when serialized as a nested value inside another resource's array,
 * regardless of what toArray() returns. Passing `null` there silently
 * dropped every "missing period" entry from the real API response.
 *
 * Scramble cannot infer this class's field types at all (every field comes
 * back a non-nullable `string` in the generated OpenAPI schema, even plain
 * bools with zero relation-chasing involved) — tried `@mixin`, shaped
 * `@return array{...}` docblocks, and native typed properties; none moved
 * it. Same unresolved class of gap as `JourneyDocument` in the frontend
 * (see journey-api.ts) — the frontend hand-declares this type instead of
 * deriving it from the generated schema.
 */
class DocumentHistoryEntryResource extends JsonResource
{
    private readonly ?Document $document;

    private readonly ?string $periodKeyValue;

    private readonly bool $isMissingValue;

    private readonly bool $isCurrentValue;

    public function __construct(PeriodHistoryEntry $entry)
    {
        parent::__construct($entry);

        $this->document = $entry->document;
        $this->periodKeyValue = $entry->periodKey;
        $this->isMissingValue = $entry->isMissing;
        $this->isCurrentValue = $entry->isCurrent;
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->document?->id,
            // Null for a rolling/one-time entry (there is no calendar
            // slot); set for a periodic entry, filed or missing alike.
            'period_key' => $this->periodKeyValue,
            'is_missing' => $this->isMissingValue,
            'is_current' => $this->isCurrentValue,
            'status' => $this->document?->status->value,
            'verified_at' => $this->document?->verified_at,
            'expires_at' => $this->document?->expires_at,
            'rejection_reason' => $this->document?->rejection_reason,
            'created_at' => $this->document?->created_at,
        ];
    }
}
