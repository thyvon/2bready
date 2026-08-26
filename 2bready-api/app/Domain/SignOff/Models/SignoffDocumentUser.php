<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Models;

use App\Domain\User\Models\User;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Carbon\CarbonInterface;
use Database\Factories\SignoffDocumentUserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $signoff_document_id
 * @property string $company_id
 * @property string $user_id
 * @property CarbonInterface|null $emailed_at
 * @property CarbonInterface|null $signed_at
 *
 * One staff member's state for one signed-off document: emailed → signed.
 */
class SignoffDocumentUser extends Model
{
    /** @use HasFactory<SignoffDocumentUserFactory> */
    use BelongsToCompany, HasFactory, HasUlid;

    protected $table = 'signoff_document_users';

    protected $fillable = [
        'signoff_document_id',
        'company_id',
        'user_id',
        'emailed_at',
        'signed_at',
    ];

    protected function casts(): array
    {
        return [
            'emailed_at' => 'datetime',
            'signed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<SignoffDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(SignoffDocument::class, 'signoff_document_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
