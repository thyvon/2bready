<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\Sop\Actions\AcknowledgeSopSignoffAction;
use App\Domain\Sop\Actions\ActivateSopAction;
use App\Domain\Sop\Actions\CreateSopAction;
use App\Domain\Sop\Actions\DeleteSopAction;
use App\Domain\Sop\Actions\GenerateSopPdfAction;
use App\Domain\Sop\Actions\GetEffectiveSopContentAction;
use App\Domain\Sop\Actions\SendSopSignoffAction;
use App\Domain\Sop\Actions\UnadoptSopAction;
use App\Domain\Sop\Actions\UpdateSopAction;
use App\Domain\Sop\Actions\UpsertSopAdoptionAction;
use App\Domain\Sop\DTOs\SopData;
use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopCompany;
use App\Domain\Sop\Models\SopSignoff;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Sop\AdoptSopRequest;
use App\Http\Requests\Api\V1\Sop\EffectiveSopContentRequest;
use App\Http\Requests\Api\V1\Sop\SendSopSignoffRequest;
use App\Http\Requests\Api\V1\Sop\StoreSopRequest;
use App\Http\Requests\Api\V1\Sop\UpdateSopRequest;
use App\Http\Resources\Api\V1\EffectiveSopContentResource;
use App\Http\Resources\Api\V1\SopResource;
use App\Http\Resources\Api\V1\SopSignoffResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

/**
 * SOP management — platform-wide templates (admin) + company-specific SOPs.
 *
 * Global SOPs (company_id = null): admin/staff create, update, activate, delete.
 * Company SOPs (company_id set): company_owner + admin/staff manage their own.
 * Adoption: company_owner adopts global SOP with optional overrides.
 */
class SopController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Sop::class);

        $query = Sop::query()->withoutGlobalScope('company')->with(['company', 'createdBy', 'adoptions.company']);

        // Company users see their company's SOPs + global SOPs they've adopted
        if (! $request->user()->hasAnyRole(['admin', 'staff', 'finance'])) {
            $companyId = $request->user()->current_company_id;
            $query->where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)
                    ->orWhere(function ($sub) use ($companyId) {
                        $sub->whereNull('company_id')
                            ->whereHas('adoptions', fn ($a) => $a->where('company_id', $companyId));
                    });
            });
        }

        // Filters
        if ($request->filled('title')) {
            $query->where('title', 'like', "%{$request->string('title')}%");
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
        if ($request->filled('global_only')) {
            $query->whereNull('company_id');
        }

        $query->orderBy('title')->orderByDesc('version');

        return ApiResponse::success(SopResource::collection($query->get()));
    }

    public function store(StoreSopRequest $request, CreateSopAction $action): JsonResponse
    {
        $this->authorize('create', Sop::class);

        $sop = $action->execute(
            SopData::fromRequest($request->validated()),
            $request->user(),
        );

        event(new AuditableActionOccurred(
            action: 'sop_created',
            companyId: $sop->company_id,
            auditableType: Sop::class,
            auditableId: $sop->id,
            changes: ['old' => null, 'new' => [
                'title' => $sop->title,
                'version' => $sop->version,
                'is_active' => $sop->is_active,
            ]],
        ));

        return ApiResponse::created(new SopResource($sop->load(['company', 'createdBy'])));
    }

    public function show(Sop $sop): JsonResponse
    {
        $this->authorize('view', $sop);

        return ApiResponse::success(new SopResource($sop->load(['company', 'createdBy', 'adoptions.company'])));
    }

    /**
     * Content a company should actually follow: its adoption override when one
     * exists, else the SOP's own content (Khmer falls back to English).
     */
    public function effectiveContent(EffectiveSopContentRequest $request, Sop $sop, GetEffectiveSopContentAction $action): JsonResponse
    {
        $this->authorize('view', $sop);

        $resolved = $action->execute(
            $sop,
            $request->user()->current_company_id,
            $request->validated('locale') ?? 'en',
        );

        return ApiResponse::success(new EffectiveSopContentResource($sop, $resolved));
    }

    /**
     * A4 PDF rendering of the SOP for the detail page's embedded viewer and
     * download — mirrors the on-screen view (both language sections).
     */
    public function pdf(Request $request, Sop $sop, GenerateSopPdfAction $action): Response
    {
        $this->authorize('view', $sop);

        // Company users get their effective copy (adoption overrides applied);
        // internal roles without a company context see the SOP as authored.
        $companyId = $request->user()->current_company_id;
        $contentEn = $companyId
            ? $sop->effectiveContentFor($companyId, 'en')['content']
            : $sop->content_en;
        $contentKh = $sop->content_kh;
        if ($companyId && $sop->company_id === null) {
            $resolvedKh = $sop->effectiveContentFor($companyId, 'kh');
            // Only carry the Khmer section into the PDF when it's genuinely
            // customized — otherwise the raw global Khmer (or EN fallback) stands.
            if ($resolvedKh['source'] === 'override') {
                $contentKh = $resolvedKh['content'];
            }
        }

        $pdf = $action->execute(
            $sop,
            $contentEn ?? '',
            $contentKh !== null && $contentKh !== '' ? $contentKh : null,
            enLabel: 'Content (English)',
            khLabel: 'Content (Khmer)',
        );

        $filename = sprintf('sop-%s-v%s.pdf', Str::slug($sop->title), $sop->version);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    public function update(UpdateSopRequest $request, Sop $sop, UpdateSopAction $action): JsonResponse
    {
        $this->authorize('update', $sop);

        $sop = $action->execute($sop, $request->validated());

        event(new AuditableActionOccurred(
            action: 'sop_updated',
            companyId: $sop->company_id,
            auditableType: Sop::class,
            auditableId: $sop->id,
        ));

        return ApiResponse::success(new SopResource($sop->load(['company', 'createdBy'])));
    }

    public function destroy(Sop $sop, DeleteSopAction $action): JsonResponse
    {
        $this->authorize('delete', $sop);

        $companyId = $sop->company_id;
        $action->execute($sop);

        event(new AuditableActionOccurred(
            action: 'sop_deleted',
            companyId: $companyId,
            auditableType: Sop::class,
            auditableId: $sop->id,
        ));

        return ApiResponse::success(['deleted' => true]);
    }

    public function activate(Request $request, Sop $sop, ActivateSopAction $action): JsonResponse
    {
        $this->authorize('activate', $sop);

        $wasActive = $sop->is_active;
        $sop = $action->execute($sop, $request->boolean('active'));

        if ($wasActive !== $sop->is_active) {
            event(new AuditableActionOccurred(
                action: $sop->is_active ? 'sop_activated' : 'sop_deactivated',
                companyId: $sop->company_id,
                auditableType: Sop::class,
                auditableId: $sop->id,
            ));
        }

        return ApiResponse::success(new SopResource($sop));
    }

    public function adopt(AdoptSopRequest $request, Sop $sop, UpsertSopAdoptionAction $action): JsonResponse
    {
        $this->authorize('adopt', $sop);

        $adoption = $action->execute(
            $sop,
            $request->user()->current_company_id,
            $request->user(),
            $request->validated('override_content_en'),
            $request->validated('override_content_kh'),
        );

        event(new AuditableActionOccurred(
            action: 'sop_adopted',
            companyId: $request->user()->current_company_id,
            auditableType: Sop::class,
            auditableId: $sop->id,
            metadata: ['adoption_id' => $adoption->id],
        ));

        return ApiResponse::created([
            'sop_company' => $adoption->load('sop'),
        ]);
    }

    public function unadopt(Request $request, SopCompany $sopCompany, UnadoptSopAction $action): JsonResponse
    {
        // Load the SOP without tenant scope so the Policy can evaluate it
        $sop = Sop::withoutGlobalScope('company')->find($sopCompany->sop_id);
        if (! $sop) {
            return ApiResponse::error('SOP not found.', [], 404);
        }

        $this->authorize('unadopt', $sopCompany);

        $action->execute($sopCompany);

        event(new AuditableActionOccurred(
            action: 'sop_unadopted',
            companyId: $sopCompany->company_id,
            auditableType: Sop::class,
            auditableId: $sopCompany->sop_id,
            metadata: ['adoption_id' => $sopCompany->id],
        ));

        return ApiResponse::success(['unadopted' => true]);
    }

    // ─── Sign-offs (v3 Sprint 8: read & acknowledge workflow) ──────────────

    /** Tracking list: every employee assigned to this SOP and their status. */
    public function signoffIndex(Request $request, Sop $sop): JsonResponse
    {
        // Route binding bypasses the tenant scope for global SOPs; the policy
        // re-checks ownership/adoption at object level.
        $this->authorize('view', $sop);

        $signoffs = $sop->signoffs()->with(['user', 'sentBy'])->orderBy('created_at')->get();

        return ApiResponse::success(SopSignoffResource::collection($signoffs));
    }

    /** Assign employees (of the current company) to read & acknowledge. */
    public function signoffStore(SendSopSignoffRequest $request, Sop $sop, SendSopSignoffAction $action): JsonResponse
    {
        $this->authorize('manageSignoffs', $sop);

        $companyId = $request->user()->current_company_id;
        if ($companyId === null) {
            return ApiResponse::error('No active company context.', [], 422);
        }

        $signoffs = $action->execute($sop, $companyId, $request->validated('user_ids'), $request->user());

        event(new AuditableActionOccurred(
            action: 'sop_signoffs_sent',
            companyId: $companyId,
            auditableType: Sop::class,
            auditableId: $sop->id,
            metadata: ['user_ids' => $request->validated('user_ids')],
        ));

        return ApiResponse::success(SopSignoffResource::collection($signoffs));
    }

    /** The current employee's own sign-offs across all SOPs. */
    public function signoffMine(Request $request): JsonResponse
    {
        // Inherently self-scoped: only the user's own rows, tenant scope on top.
        // Pending acknowledgments first — Postgres ASC puts NULLs last.
        $signoffs = SopSignoff::query()
            ->where('user_id', $request->user()->id)
            ->with(['sop', 'sentBy'])
            ->orderByRaw('signed_at asc nulls first')
            ->orderBy('created_at')
            ->get();

        return ApiResponse::success(SopSignoffResource::collection($signoffs));
    }

    /** The assigned employee reads & acknowledges their sign-off. */
    public function signoffAcknowledge(Request $request, SopSignoff $signoff, AcknowledgeSopSignoffAction $action): JsonResponse
    {
        $wasAcknowledged = $signoff->signed_at !== null;

        $this->authorize('acknowledge', $signoff);

        $signoff = $action->execute($signoff, $request->user());

        if (! $wasAcknowledged) {
            event(new AuditableActionOccurred(
                action: 'sop_signoff_acknowledged',
                companyId: $signoff->company_id,
                auditableType: SopSignoff::class,
                auditableId: $signoff->id,
            ));
        }

        return ApiResponse::success(new SopSignoffResource($signoff->load(['user', 'sentBy'])));
    }
}
