<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Journey;

use Illuminate\Foundation\Http\FormRequest;

class StoreJourneyLevelMedalRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            // MIME + size validated here, before the file ever touches
            // storage — CLAUDE.md's non-negotiable rule. Tighter than
            // Document's 10MB limit since this is a small icon asset.
            'file' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ];
    }
}
