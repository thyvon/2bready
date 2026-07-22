<?php

declare(strict_types=1);

namespace App\Domain\DataRoom\Actions;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\DataRoom\Models\DataRoomLink;
use App\Domain\User\Models\User;

class RevokeDataRoomLinkAction
{
    public function execute(DataRoomLink $link, User $revokedBy): void
    {
        $link->update(['revoked_at' => now()]);

        event(new AuditableActionOccurred(
            action: 'data_room_link_revoked',
            companyId: $link->company_id,
            auditableType: DataRoomLink::class,
            auditableId: $link->id,
            actorId: $revokedBy->id,
            actorEmail: $revokedBy->email,
        ));
    }
}
