<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Sop\Models\Sop;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Effective SOP content for the requesting user's company — adoption override
 * when present, else the SOP's own content, with Khmer falling back to English.
 *
 * @mixin Sop
 */
class EffectiveSopContentResource extends JsonResource
{
    /** @param array{content: ?string, source: 'override'|'base', locale: string} $resolved */
    public function __construct(Sop $resource, private readonly array $resolved)
    {
        parent::__construct($resource);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'sop_id' => $this->id,
            'title' => $this->title,
            'version' => $this->version,
            'is_active' => $this->is_active,
            'is_global' => $this->company_id === null,
            'effective_at' => $this->effective_at?->toISOString(),
            'locale' => $this->resolved['locale'],
            'source' => $this->resolved['source'],
            'content' => $this->resolved['content'],
        ];
    }
}
