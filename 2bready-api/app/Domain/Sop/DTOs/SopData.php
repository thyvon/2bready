<?php

declare(strict_types=1);

namespace App\Domain\Sop\DTOs;

use Illuminate\Support\Carbon;

/**
 * Immutable data transfer object for SOP operations.
 */
readonly class SopData
{
    public function __construct(
        public string $title,
        public string $version,
        public string $content_en,
        public ?string $content_kh,
        public ?Carbon $effective_at,
        public bool $is_active,
        public ?string $company_id,
    ) {}

    /** @param array{title: string, version: string, content_en: string, content_kh?: ?string, effective_at?: mixed, is_active?: bool, company_id?: ?string} $data */
    public static function fromRequest(array $data): self
    {
        return new self(
            title: $data['title'],
            version: $data['version'],
            content_en: $data['content_en'],
            content_kh: $data['content_kh'] ?? null,
            effective_at: isset($data['effective_at']) ? Carbon::parse($data['effective_at']) : null,
            is_active: (bool) ($data['is_active'] ?? false),
            company_id: $data['company_id'] ?? null,
        );
    }
}
