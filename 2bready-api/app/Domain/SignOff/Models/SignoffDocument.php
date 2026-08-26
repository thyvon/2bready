<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Models;

use App\Domain\SignOff\Enums\SignoffDocumentCategory;
use App\Domain\SignOff\Enums\SignoffDocumentStatus;
use App\Domain\User\Models\User;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Carbon\CarbonInterface;
use Database\Factories\SignoffDocumentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $company_id
 * @property SignoffDocumentCategory $category
 * @property string $title
 * @property string $file_path
 * @property string $original_filename
 * @property string $mime_type
 * @property int $size_bytes
 * @property SignoffDocumentStatus $status
 * @property string|null $rejection_comment
 * @property CarbonInterface|null $verified_at
 *
 * A client-uploaded document the platform verifies, after which the owner
 * may email it to staff for read & sign-off. The per-staff state lives in
 * SignoffDocumentUser rows.
 */
class SignoffDocument extends Model
{
    /** @use HasFactory<SignoffDocumentFactory> */
    use Auditable, BelongsToCompany, HasFactory, HasUlid, SoftDeletes;

    protected $table = 'signoff_documents';

    protected static function newFactory(): SignoffDocumentFactory
    {
        return SignoffDocumentFactory::new();
    }

    protected $fillable = [
        'company_id',
        'category',
        'title',
        'file_path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'status',
        'rejection_comment',
        'uploaded_by_user_id',
        'verified_by_user_id',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'category' => SignoffDocumentCategory::class,
            'status' => SignoffDocumentStatus::class,
            'verified_at' => 'datetime',
            'size_bytes' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    /** @return BelongsTo<User, $this> */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_user_id');
    }

    /** All staff assignments for this document.
     *
     * @return HasMany<SignoffDocumentUser, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(SignoffDocumentUser::class)->oldest();
    }

    /** Verified documents only — the send-to-staff pool.
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeVerified(Builder $query): Builder
    {
        return $query->where('status', SignoffDocumentStatus::Verified);
    }
}
