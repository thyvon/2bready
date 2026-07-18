<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\Models\DocumentTemplate;

class UpdateDocumentTemplateAction
{
    /** @param array<string, mixed> $data */
    public function execute(DocumentTemplate $documentTemplate, array $data): DocumentTemplate
    {
        $documentTemplate->update($data);

        return $documentTemplate;
    }
}
