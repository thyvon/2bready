<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\DTOs;

use Spatie\LaravelData\Data;

class TpPartnerData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $name_kh,
        public readonly ?int $price_l2_cents,
        public readonly ?int $price_l3_cents,
        public readonly ?int $price_l4_cents,
        public readonly ?int $price_l1_cents,
    ) {}
}
