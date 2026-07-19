<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Actions\GenerateJourneyLevelMedalUrlAction;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Services\JourneyProgressService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shape deliberately mirrors client-portal's journey-data.ts mock (BADGE_LEVELS,
 * Milestone, activeLevelCodes) — that's the real, signed-off taxonomy the
 * frontend was built against, so the real API should slot into it, not the
 * other way around.
 *
 * @mixin Journey
 */
class JourneyResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var Company $company */
        $company = $this->company;
        $unlockedLevelCodes = app(JourneyProgressService::class)->unlockedLevelCodes($company);

        return [
            'id' => $this->id,
            'status' => $this->status,
            'activated_at' => $this->activated_at,
            'journey_template' => [
                'id' => $this->journeyTemplate->id,
                'name' => $this->journeyTemplate->name,
                'name_kh' => $this->journeyTemplate->name_kh,
            ],
            'levels' => $this->journeyTemplate->levels
                ->map(fn (JourneyLevel $level) => $this->mapLevel($level, $unlockedLevelCodes))
                ->values()->all(),
        ];
    }

    /**
     * @param  array<string>  $unlockedLevelCodes
     * @return array<string, mixed>
     */
    private function mapLevel(JourneyLevel $level, array $unlockedLevelCodes): array
    {
        return [
            'id' => $level->id,
            'code' => $level->code,
            'name' => $level->name,
            'pathway_name' => $level->pathway_name,
            'pillar' => $level->pillar,
            'unlocked' => in_array($level->code, $unlockedLevelCodes, true),
            'medal_image_url' => $level->medal_image_path
                ? app(GenerateJourneyLevelMedalUrlAction::class)->execute($level)
                : null,
            'milestones' => $level->milestones->map(fn (Milestone $milestone) => $this->mapMilestone($milestone))->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function mapMilestone(Milestone $milestone): array
    {
        return [
            'id' => $milestone->id,
            'name' => $milestone->name,
            'completed' => $milestone->completions->contains(
                fn ($completion) => $completion->company_id === $this->company_id,
            ),
            'documents' => $milestone->documentTemplates->map(fn (DocumentTemplate $template) => $this->mapDocument($template))->values()->all(),
        ];
    }

    /**
     * "pending" when nothing has been uploaded yet — that's the absence of a
     * Document row, not a real status value (see DocumentStatus; there's no
     * "not uploaded" case in the real enum, only in this derived API shape).
     *
     * @return array<string, mixed>
     */
    private function mapDocument(DocumentTemplate $template): array
    {
        $latestDocument = $template->getAttribute('latest_document');

        return [
            'id' => $template->id,
            // The real, uploaded Document row's id — null until one exists.
            // Needed to request a signed preview URL (GET
            // /documents/{document}/preview-url); `id` above is always the
            // DocumentTemplate's id, not this one.
            'document_id' => $latestDocument?->id,
            'name' => $template->name,
            'is_required' => $template->is_required,
            'status' => $latestDocument?->status->value ?? 'pending',
            // Null = shared taxonomy; set = this one company's own extra
            // requirement. Staff's per-company Journey tab uses this to know
            // which nodes it may edit/delete here (client-portal ignores it
            // — extras merge in seamlessly for the company itself).
            'company_id' => $template->company_id,
            // Sub-documents stay nested here (not flattened) so the company
            // sees the same grouping relationship staff set up in the
            // editor — recurses via nestFlat's in-memory `children`.
            'children' => $template->relationLoaded('children')
                ? $template->children->map(fn (DocumentTemplate $child) => $this->mapDocument($child))->values()->all()
                : [],
        ];
    }
}
