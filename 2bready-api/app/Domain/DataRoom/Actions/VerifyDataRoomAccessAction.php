<?php

declare(strict_types=1);

namespace App\Domain\DataRoom\Actions;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\DataRoom\Exceptions\DataRoomLinkInvalidException;
use App\Domain\DataRoom\Exceptions\InvalidDataRoomPinException;
use App\Domain\DataRoom\Models\DataRoomLink;
use App\Domain\Document\Enums\DocumentStatus;
use App\Domain\Document\Models\Document;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * The public, unauthenticated entry point — a link+PIN IS the credential
 * here, there is no Sanctum token at all. Every attempt (granted or denied)
 * writes an audit_logs row (CLAUDE.md Rule #2 / v2 proposal precedent:
 * "every access attempt — granted or denied — logged to audit_logs").
 */
class VerifyDataRoomAccessAction
{
    private const VIEW_SESSION_CACHE_PREFIX = 'data_room_view_session:';

    private const VIEW_SESSION_MAX_MINUTES = 30;

    /** @return array{view_session: string, company_name: string, documents: Collection<int, Document>} */
    public function execute(string $token, string $pin, string $ip): array
    {
        $link = DataRoomLink::query()->where('token', $token)->first();

        if (! $link || ! $link->isActive()) {
            event(new AuditableActionOccurred(
                action: 'data_room_accessed',
                companyId: $link?->company_id,
                auditableType: DataRoomLink::class,
                auditableId: $link?->id,
                metadata: ['ip' => $ip, 'granted' => false, 'reason' => $link ? $link->status()->value : 'not_found'],
            ));

            throw new DataRoomLinkInvalidException('This link is no longer valid.');
        }

        // Uppercase defensively — the PIN is always generated uppercase
        // (see CreateDataRoomLinkAction) and the frontend normalizes to
        // uppercase before submit too, but case isn't meant to carry any
        // security weight here, so a direct API caller sending lowercase
        // shouldn't be rejected on that basis alone.
        if (! Hash::check(strtoupper($pin), (string) $link->pin_hash)) {
            event(new AuditableActionOccurred(
                action: 'data_room_accessed',
                companyId: $link->company_id,
                auditableType: DataRoomLink::class,
                auditableId: $link->id,
                metadata: ['ip' => $ip, 'granted' => false, 'reason' => 'wrong_pin'],
            ));

            throw new InvalidDataRoomPinException('Incorrect PIN.');
        }

        event(new AuditableActionOccurred(
            action: 'data_room_accessed',
            companyId: $link->company_id,
            auditableType: DataRoomLink::class,
            auditableId: $link->id,
            metadata: ['ip' => $ip, 'granted' => true],
        ));

        // Single-use-per-page-load, not single-use-per-request — lets the
        // frontend request one preview-url per document click without
        // re-submitting the PIN every time, without ever persisting a real
        // session. Capped at the link's own remaining lifetime so a
        // near-expiry link can't mint a session that outlives it.
        $viewSession = Str::random(64);
        $ttlMinutes = min(self::VIEW_SESSION_MAX_MINUTES, max(1, now()->diffInMinutes($link->expires_at)));
        Cache::put(self::VIEW_SESSION_CACHE_PREFIX.$viewSession, $link->id, now()->addMinutes($ttlMinutes));

        return [
            'view_session' => $viewSession,
            'company_name' => $link->company->name,
            'documents' => $this->verifiedDocuments($link->company_id),
        ];
    }

    // Public, cache-backed lookup (no Sanctum token to authorize against) —
    // used by PublicDataRoomController::previewUrl to confirm a view-session
    // is still valid and resolve which company/link it belongs to.
    public function resolveLinkForViewSession(string $viewSession): ?DataRoomLink
    {
        $linkId = Cache::get(self::VIEW_SESSION_CACHE_PREFIX.$viewSession);

        return $linkId ? DataRoomLink::query()->find($linkId) : null;
    }

    // Same L3/L4-verified scoping as verifiedDocuments() below, narrowed to
    // one id — used by PublicDataRoomController::previewUrl. A valid
    // view_session only proves "this viewer unlocked this company's data
    // room," NOT "this specific document is part of what's shared" — a
    // bare company_id match would let a viewer enumerate arbitrary document
    // ids within the same company, including private L1/L2 or
    // unverified/rejected ones never meant to leave the vault.
    public function findShareableDocument(string $companyId, string $documentId): ?Document
    {
        return $this->verifiedDocumentsQuery($companyId)
            ->where('documents.id', $documentId)
            ->first();
    }

    // Single indexed JOIN instead of nested whereHas() (which compiles to
    // correlated EXISTS subqueries, one per relation hop) — every join
    // column here (documents.company_id, documents.document_template_id,
    // document_templates.milestone_id, milestones.journey_level_id) is
    // already indexed by its own migration. Eager-loads documentTemplate
    // (one extra indexed query, not per-row N+1) so an external viewer sees
    // the checklist item's real name ("Audited Financial Statement") via
    // the resource's normal `$document->documentTemplate->name`, not a raw
    // uploaded filename like "scan001.pdf" — and not a raw select-alias
    // Larastan can't type-check.
    /** @return Collection<int, Document> */
    private function verifiedDocuments(string $companyId): Collection
    {
        return $this->verifiedDocumentsQuery($companyId)->get();
    }

    /** @return Builder<Document> */
    private function verifiedDocumentsQuery(string $companyId)
    {
        return Document::query()
            ->select('documents.*')
            ->with('documentTemplate')
            ->join('document_templates', 'document_templates.id', '=', 'documents.document_template_id')
            ->join('milestones', 'milestones.id', '=', 'document_templates.milestone_id')
            ->join('journey_levels', 'journey_levels.id', '=', 'milestones.journey_level_id')
            ->where('documents.company_id', $companyId)
            ->where('documents.status', DocumentStatus::Verified)
            ->whereIn('journey_levels.code', ['L3', 'L4']);
    }
}
