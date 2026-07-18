<?php

declare(strict_types=1);

namespace App\Domain\AuditLog\Models;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use RuntimeException;

/**
 * Write-once (see Rule #2 in this repo's CLAUDE.md). Every write goes through
 * RecordAuditLogAction, called only by RecordAuditLogListener — never
 * construct/save one directly outside that path. update()/delete() are
 * refused outright here as the application-layer half of that guarantee; the
 * create_audit_logs_table migration REVOKEs UPDATE/DELETE at the DB layer too.
 */
class AuditLog extends Model
{
    use HasUlid;

    public $timestamps = false;

    protected $fillable = [
        'company_id',
        'user_id',
        'actor_email',
        'action',
        'auditable_type',
        'auditable_id',
        'changes',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function save(array $options = [])
    {
        if ($this->exists) {
            throw new RuntimeException('AuditLog records are immutable and cannot be updated.');
        }

        if (! isset($this->attributes['created_at'])) {
            $this->attributes['created_at'] = now();
        }

        return parent::save($options);
    }

    public function delete()
    {
        throw new RuntimeException('AuditLog records are immutable and cannot be deleted.');
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The record this entry is about, for model-mutation entries (null for security events).
     *
     * @return MorphTo<Model, $this>
     */
    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }
}
