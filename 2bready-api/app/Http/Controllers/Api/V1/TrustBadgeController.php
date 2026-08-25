<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Audit\Models\Audit;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\TrustBadge\Models\TrustBadge;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\TrustBadgeResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Trust badges for the current company — the client portal's "my badges"
 * list. Company users see their own (via BelongsToCompany); internal
 * admin/staff/finance bypass the scope and see all badges (role-based, the
 * same back-office cross-tenant pattern as every other admin list). The
 * public verification surface is a separate, unauthenticated path
 * (PublicVerificationController).
 */
class TrustBadgeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $badges = TrustBadge::query()
            ->with('certificate')
            ->orderByDesc('issued_at')
            ->get();

        return ApiResponse::success(TrustBadgeResource::collection($badges));
    }

    /**
     * The verification report behind a badge (owner-concept MVP 6.3.3.2):
     * enterprise profile, executive summary and the per-document
     * verification ledger for the badge's level. Company users may only
     * read their own (BelongsToCompany scopes the binding); internal
     * roles bypass by role.
     */
    public function report(Request $request, TrustBadge $trustBadge): JsonResponse
    {
        $company = $trustBadge->company;
        $level = JourneyLevel::query()->findOrFail($trustBadge->journey_level_id);
        $audit = Audit::query()->find($trustBadge->audit_id);

        // Ledger: every main document template at this level with its
        // current state for this company. Bypass flags (e.g. <8 employees
        // waiving Internal Rules) render as Bypassed, matching how the
        // milestone engine treats them.
        $bypassFlags = $company->bypass_flags ?? [];
        $ledger = [];

        foreach ($level->milestones->sortBy('sort_order') as $milestone) {
            $templates = DocumentTemplate::query()
                ->where('milestone_id', $milestone->id)
                ->whereNull('parent_id')
                ->where(fn ($q) => $q->whereNull('company_id')->orWhere('company_id', $company->id))
                ->orderBy('sort_order')
                ->get();

            foreach ($templates as $template) {
                $bypassKey = $template->bypass_key;

                $verifiedAt = null;

                if ($bypassKey !== null && ($bypassFlags[$bypassKey] ?? false)) {
                    $status = 'Bypassed';
                    $method = 'Auto-bypass rule';
                    $verifiedAt = null;
                } else {
                    $latest = Document::query()
                        ->where('company_id', $company->id)
                        ->where('document_template_id', $template->id)
                        ->latest('id')
                        ->first();

                    $status = $latest?->status?->value === 'verified' ? 'Verified' : ucfirst((string) ($latest?->status?->value ?? 'Pending'));
                    $method = 'Auditor review';
                    $verifiedAt = $latest?->verified_at?->toISOString();
                }

                $ledger[] = [
                    'milestone' => $milestone->name,
                    'document' => $template->name,
                    'status' => $status,
                    'method' => $method,
                    'verified_at' => $verifiedAt,
                ];
            }
        }

        $score = (int) ($company->compliance_score ?? 0);

        return ApiResponse::success([
            'badge' => [
                'level' => $trustBadge->level,
                'level_name' => $level->name,
                'pathway_name' => $level->pathway_name,
                'label' => "{$trustBadge->level}: {$level->pathway_name} — {$level->name}",
                'issued_at' => $trustBadge->issued_at?->toISOString(),
                'verify_url' => $trustBadge->qr_payload_url,
                'qr_code' => $trustBadge->certificate?->qr_payload_url,
            ],
            'company' => [
                'name' => $company->name,
                'name_kh' => $company->name_kh,
                'sector' => $company->industry?->code,
                'country' => $company->country_code,
                'employee_count' => $company->employee_count,
            ],
            'audit' => [
                'id' => $audit?->id ?? $trustBadge->audit_id,
                'score' => $audit?->score ?? $score,
                'feedback' => $audit?->feedback,
                'approved_at' => $audit?->updated_at?->toISOString(),
            ],
            // The certificate-style headline block mirrors the mockup's copy.
            'summary' => "This report confirms that the enterprise has successfully completed level {$trustBadge->level} data verification, achieving {$score}% mastery of its compliance requirements via the hybrid ADMIT UNIT mechanism.",
            'stamp' => $trustBadge->certificate?->master_verifier_stamp,
            'ledger' => $ledger,
        ]);
    }
}
