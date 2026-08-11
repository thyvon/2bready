<?php

declare(strict_types=1);

namespace App\Domain\Document\Models;

use App\Domain\Document\Enums\DocumentStatus;
use App\Domain\User\Models\User;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\DocumentFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property DocumentStatus $status
 * @property int $size_bytes
 * @property string|null $period_key
 * @property Carbon|null $expires_at
 * @property Carbon|null $expiry_reminded_at
 *
 * @use HasFactory<DocumentFactory>
 */
class Document extends Model
{
    /** @use HasFactory<DocumentFactory> */
    use Auditable, BelongsToCompany, HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<Document> */
    protected static function newFactory(): Factory
    {
        return DocumentFactory::new();
    }

    protected $fillable = [
        'company_id',
        'document_template_id',
        'uploaded_by_user_id',
        'file_path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'status',
        'period_key',
        'comment',
        'rejected_by_user_id',
        'verified_by_user_id',
        'verified_at',
        'expires_at',
        'expiry_reminded_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => DocumentStatus::class,
            'size_bytes' => 'integer',
            'verified_at' => 'datetime',
            'expires_at' => 'datetime',
            'expiry_reminded_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<DocumentTemplate, $this> */
    public function documentTemplate(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class);
    }

    /** @return BelongsTo<User, $this> */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    /** @return BelongsTo<User, $this> */
    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_user_id');
    }

    /** @return BelongsTo<User, $this> */
    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by_user_id');
    }
}
