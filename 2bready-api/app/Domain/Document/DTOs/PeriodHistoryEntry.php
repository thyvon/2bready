<?php

declare(strict_types=1);

namespace App\Domain\Document\DTOs;

use App\Domain\Document\Models\Document;

/**
 * One slot in a checklist item's history — a real typed carrier (not a
 * plain array) so DocumentHistoryEntryResource's `@mixin` lets Scramble
 * infer the OpenAPI shape by walking real typed properties, the same
 * mechanism that already works for every other Resource in this codebase.
 * A raw array here previously collapsed every field (even the booleans) to
 * a non-nullable `string` in the generated types — arrays carry no static
 * shape Scramble can walk, unlike a real class's declared property types.
 *
 * @property ?Document $document
 * @property ?string $periodKey
 * @property bool $isMissing
 * @property bool $isCurrent
 */
class PeriodHistoryEntry
{
    public function __construct(
        public readonly ?Document $document,
        public readonly ?string $periodKey,
        public readonly bool $isMissing,
        public readonly bool $isCurrent,
    ) {}
}
