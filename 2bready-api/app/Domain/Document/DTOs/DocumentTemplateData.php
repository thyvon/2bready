<?php

declare(strict_types=1);

namespace App\Domain\Document\DTOs;

use Spatie\LaravelData\Data;

class DocumentTemplateData extends Data
{
    public function __construct(
        public readonly string $milestone_id,
        public readonly string $name,
        public readonly ?string $parent_id = null,
        public readonly ?string $company_id = null,
        public readonly ?string $description = null,
        public readonly bool $is_required = true,
        public readonly bool $client_can_add_subdocs = false,
        public readonly string $recurrence_type = 'one_time',
        public readonly ?int $expiry_months = null,
        public readonly int $sort_order = 0,
    ) {}
}
