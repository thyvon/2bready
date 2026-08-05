<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Marketplace;

use Illuminate\Foundation\Http\FormRequest;

// Company verdict on a completed hire. rating is validated here as an
// integer 1..5 — mirroring the DB CHECK constraint, per this project's
// "validation mirrors schema" rule. review_text is optional, trimmed, and
// length-capped so a single review can never bloat the marketplace payload.
class RateTpHireRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review_text' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
