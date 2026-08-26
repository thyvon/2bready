<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Actions;

use App\Domain\SignOff\Models\SignoffDocumentUser;

/** A staff member confirms they have read the document. */
class AcknowledgeSignoffDocumentUserAction
{
    public function execute(SignoffDocumentUser $row): SignoffDocumentUser
    {
        if ($row->signed_at === null) {
            $row->update(['signed_at' => now()]);
        }

        return $row->fresh();
    }
}
