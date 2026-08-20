<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Sop;

use App\Domain\Sop\Models\Sop;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSopRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'staff', 'company_owner']) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var Sop $sop */
        $sop = $this->route('sop');

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'version' => ['sometimes', 'required', 'string', 'max:50'],
            'content_en' => ['sometimes', 'required', 'string'],
            'content_kh' => ['nullable', 'string'],
            'effective_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'company_id' => ['prohibited'], // Company_id is immutable after creation
        ];
    }
}
