<?php

declare(strict_types=1);

namespace App\Domain\Package\Actions;

use App\Domain\Package\DTOs\LeadData;
use App\Domain\Package\Models\Lead;
use App\Domain\User\Models\User;

class CaptureLeadAction
{
    public function execute(LeadData $data, ?User $user = null): Lead
    {
        return Lead::create([
            'company_id' => $user?->company_id,
            'name' => $data->name,
            'email' => $data->email,
            'phone' => $data->phone,
            'company_name' => $data->company_name,
            'source' => $data->source,
        ]);
    }
}
