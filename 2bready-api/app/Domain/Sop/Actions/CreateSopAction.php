<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\DTOs\SopData;
use App\Domain\Sop\Models\Sop;
use App\Domain\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Creates a new SOP (global template or company-specific).
 *
 * Global SOPs (company_id = null) are platform-wide templates.
 * Company-specific SOPs belong to a single company.
 * Only one active SOP per (company, title, version) is enforced by unique index.
 */
class CreateSopAction
{
    public function execute(SopData $data, User $createdBy): Sop
    {
        return DB::transaction(function () use ($data, $createdBy) {
            // If activating this SOP, deactivate any other active SOP for the same company
            if ($data->is_active) {
                $this->deactivateOthers($data->company_id, $data->title);
            }

            return Sop::create([
                'title' => $data->title,
                'version' => $data->version,
                'content_en' => $data->content_en,
                'content_kh' => $data->content_kh,
                'effective_at' => $data->effective_at,
                'is_active' => $data->is_active,
                'company_id' => $data->company_id,
                'created_by_user_id' => $createdBy->id,
            ]);
        });
    }

    private function deactivateOthers(?string $companyId, string $title): void
    {
        Sop::query()
            ->where('company_id', $companyId)
            ->where('title', $title)
            ->where('is_active', true)
            ->update(['is_active' => false]);
    }
}
