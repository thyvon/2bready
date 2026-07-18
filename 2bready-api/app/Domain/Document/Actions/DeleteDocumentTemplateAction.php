<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\Models\DocumentTemplate;

class DeleteDocumentTemplateAction
{
    public function execute(DocumentTemplate $documentTemplate): void
    {
        $documentTemplate->delete();
    }
}
