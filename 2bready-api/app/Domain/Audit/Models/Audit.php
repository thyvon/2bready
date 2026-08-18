<?php

declare(strict_types=1);

namespace App\Domain\Audit\Models;

use App\Domain\Audit\Enums\AuditStatus;
use App\Domain\Document\Models\Document;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\TpPartner\Models\Auditor;
use App\Domain\TpPartner\Models\TpPartner;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\AuditFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Support\Carbon;

/**
 * The level-level review verdict. company_id makes this genuinely
 * tenant-scoped (Rule #1), but the caller scoping it by TP-firm membership
 * (auditors via AuditPolicy) is never company-bypassed the way
 * admin/staff/finance are — so those callers must explicitly
 * withoutGlobalScope('company'), the same pattern as Document's back-office
 * queries and TpHireController::complete().
 *
 * @property AuditStatus $status
 * @property int|null $score
 * @property string|null $feedback
 * @property Carbon|null $deadline
 * @property Carbon|null $assigned_at
 * @property Carbon|null $submitted_at
 * @property Carbon|null $reviewed_at
 * @property Carbon|null $cancelled_at
 *
 * @use HasFactory<AuditFactory>
 */
class Audit extends Model
{
    /** @use HasFactory<AuditFactory> */
    use Auditable, BelongsToCompany, HasFactory, HasUlid;

    protected $fillable = [
        'company_id',
        'tp_hire_id',
        'auditor_id',
        'journey_level',
        'status',
        'score',
        'feedback',
        'deadline',
        'assigned_at',
        'submitted_at',
        'reviewed_at',
        'cancelled_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => AuditStatus::class,
            'score' => 'integer',
            'deadline' => 'datetime',
            'assigned_at' => 'datetime',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<TpHire, $this> */
    public function tpHire(): BelongsTo
    {
        return $this->belongsTo(TpHire::class, 'tp_hire_id');
    }

    /** @return BelongsTo<Auditor, $this> */
    public function auditor(): BelongsTo
    {
        return $this->belongsTo(Auditor::class);
    }

    /** @return HasOneThrough<TpPartner, TpHire, $this> */
    public function tpPartner(): HasOneThrough
    {
        return $this->hasOneThrough(TpPartner::class, TpHire::class, 'tp_partner_id', 'id', 'tp_hire_id', 'id');
    }

    /**
     * The documents reviewed as evidence for this audit — the same
     * verify/reject flow that a TP already performs per-document feeds this
     * pivot, so an approved audit has a defensible audit trail of what was
     * actually examined.
     *
     * @return BelongsToMany<Document, $this>
     */
    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class, 'audit_documents');
    }

    /**
     * The set of documents at this audit's level that belong to the audited
     * company — the natural evidence set for a pending audit. Resolved with
     * withoutGlobalScope('company') because the auditor caller that reaches
     * this through a submitted audit is never company-bypassed (same
     * reasoning as DocumentPolicy::manage()).
     *
     * @return Builder<Document>
     */
    public function levelDocuments(): Builder
    {
        return Document::query()->withoutGlobalScope('company')
            ->where('company_id', $this->company_id)
            ->whereHas('documentTemplate.milestone.journeyLevel', fn (Builder $query) => $query->where('code', $this->journey_level));
    }
}
