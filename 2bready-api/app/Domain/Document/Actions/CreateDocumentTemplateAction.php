<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\DTOs\DocumentTemplateData;
use App\Domain\Document\Models\DocumentTemplate;

class CreateDocumentTemplateAction
{
    public function execute(DocumentTemplateData $data): DocumentTemplate
    {
        return DocumentTemplate::create([
            'milestone_id' => $data->milestone_id,
            'name' => $data->name,
            'description' => $data->description,
            'is_required' => $data->is_required,
            'expiry_months' => $data->expiry_months,
            'sort_order' => $data->sort_order,
        ]);
    }
}
