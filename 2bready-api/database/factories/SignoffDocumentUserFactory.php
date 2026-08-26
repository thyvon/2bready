<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\SignOff\Models\SignoffDocumentUser;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SignoffDocumentUser>
 */
class SignoffDocumentUserFactory extends Factory
{
    protected $model = SignoffDocumentUser::class;

    public function definition(): array
    {
        return [
            // signoff_document_id + company_id + user_id are set by the caller
            // (they must agree with the document's own company).
            'emailed_at' => now(),
            'signed_at' => null,
        ];
    }
}
