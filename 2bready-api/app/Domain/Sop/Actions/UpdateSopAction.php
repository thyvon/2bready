<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\DTOs\SopData;
use App\Domain\Sop\Models\Sop;
use Illuminate\Support\Facades\DB;

/**
 * Updates an existing SOP.
 *
 * If activating, deactivates other SOPs with the same title for the company.
 * Global SOPs (company_id = null) can only be updated by admins.
 */
class UpdateSopAction
{
    /** @param array<string, mixed> $validated */
    public function execute(Sop $sop, array $validated): Sop
    {
        return DB::transaction(function () use ($sop, $validated) {
            // UpdateSopRequest is partial — merge the submitted fields over the
            // current values so SopData (all-or-nothing) never sees a gap.
            $data = SopData::fromRequest(array_merge([
                'title' => $sop->title,
                'version' => $sop->version,
                'content_en' => $sop->content_en,
                'content_kh' => $sop->content_kh,
                'effective_at' => $sop->effective_at?->toDateTimeString(),
                'is_active' => $sop->is_active,
            ], $validated));

            // If activating this SOP, deactivate any other active SOP for the same company
            if ($data->is_active && (! $sop->is_active || $sop->title !== $data->title)) {
                $this->deactivateOthers($sop->company_id, $data->title, $sop->id);
            }

            $sop->update([
                'title' => $data->title,
                'version' => $data->version,
                'content_en' => $data->content_en,
                'content_kh' => $data->content_kh,
                'effective_at' => $data->effective_at,
                'is_active' => $data->is_active,
            ]);

            return $sop->fresh();
        });
    }

    private function deactivateOthers(?string $companyId, string $title, string $excludeId): void
    {
        Sop::query()
            ->where('company_id', $companyId)
            ->where('title', $title)
            ->where('id', '!=', $excludeId)
            ->where('is_active', true)
            ->update(['is_active' => false]);
    }
}
