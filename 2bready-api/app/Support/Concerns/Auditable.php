<?php

declare(strict_types=1);

namespace App\Support\Concerns;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use Illuminate\Support\Str;

/**
 * Apply to every domain model so every create/update/delete is recorded
 * automatically, without each Action remembering to fire its own event —
 * see the AuditLog domain. Fires one generic AuditableActionOccurred event
 * per mutation; RecordAuditLogListener does the actual writing.
 */
trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->recordAuditEvent('created', null, $model->auditableAttributes($model->getAttributes()));
        });

        static::updated(function ($model) {
            $changedKeys = array_keys($model->auditableAttributes($model->getChanges()));

            // A save() that only touched timestamps (e.g. a touch() from a
            // parent relationship) has nothing meaningful to record.
            if (empty($changedKeys)) {
                return;
            }

            $old = array_intersect_key($model->auditableAttributes($model->getOriginal()), array_flip($changedKeys));
            $new = array_intersect_key($model->auditableAttributes($model->getChanges()), array_flip($changedKeys));
            $model->recordAuditEvent('updated', $old, $new);
        });

        static::deleted(function ($model) {
            $model->recordAuditEvent('deleted', $model->auditableAttributes($model->getOriginal()), null);
        });
    }

    /**
     * Drops timestamp noise, and redacts (never drops — the fact that a
     * password changed is itself worth recording, just never the value)
     * anything the model already treats as sensitive via its own $hidden
     * list (password, two_factor_secret, etc.). Dropping hidden keys
     * entirely, instead of redacting them, would mean an update that only
     * touched a hidden field (a password reset, most notably) produces an
     * empty diff and — since bootAuditable() skips firing when nothing
     * changed — silently leaves no audit trail at all for exactly the kind
     * of change that most needs one.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    protected function auditableAttributes(array $attributes): array
    {
        $hidden = array_flip($this->getHidden());
        $result = [];

        foreach ($attributes as $key => $value) {
            if ($key === 'created_at' || $key === 'updated_at') {
                continue;
            }

            $result[$key] = isset($hidden[$key]) ? '[redacted]' : $value;
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>|null  $old
     * @param  array<string, mixed>|null  $new
     */
    private function recordAuditEvent(string $event, ?array $old, ?array $new): void
    {
        // Not AuditableActionOccurred::dispatch() — Illuminate\Foundation\Events\
        // Dispatchable::dispatch() takes no declared parameters and reads
        // func_get_args() internally, which can't resolve named arguments at all
        // (every named-arg call throws "Unknown named parameter"). event(new ...())
        // is this codebase's own established call-site convention anyway (see
        // VerifyDocumentAction's event(new DocumentVerified($document))).
        event(new AuditableActionOccurred(
            action: Str::snake(class_basename($this)).'.'.$event,
            // Not getAttribute('company_id') — Model::shouldBeStrict() is enabled
            // outside production (see AppServiceProvider::boot()), which makes that
            // throw MissingAttributeException for the many audited models (Company
            // itself, User, Package, Industry, ...) that have no company_id column
            // at all, instead of the plain null a non-strict app would get.
            companyId: $this->getAttributes()['company_id'] ?? null,
            auditableType: static::class,
            auditableId: (string) $this->getKey(),
            changes: ['old' => $old, 'new' => $new],
        ));
    }
}
