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
            // Resolve company_id based on the creator's role:
            // - company_owner: forced to their current company (policy forbids global)
            // - admin/staff: use provided company_id (or null for global)
            // - others: policy already forbids creation
            $companyId = $this->resolveCompanyId($data, $createdBy);

            // If activating this SOP, deactivate any other active SOP for the same company
            if ($data->is_active) {
                $this->deactivateOthers($companyId, $data->title);
            }

            return Sop::create([
                'title' => $data->title,
                'version' => $data->version,
                'content_en' => $data->content_en,
                'content_kh' => $data->content_kh,
                'effective_at' => $data->effective_at,
                'is_active' => $data->is_active,
                'company_id' => $companyId,
                'created_by_user_id' => $createdBy->id,
            ]);
        });
    }

    private function resolveCompanyId(SopData $data, User $user): ?string
    {
        // Company owners can only create for their own company; request omits company_id
        if ($user->hasRole('company_owner')) {
            return $user->current_company_id;
        }

        // Admin/staff: use provided company_id (null = global)
        return $data->company_id;
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
