<?php

declare(strict_types=1);

namespace App\Domain\DataRoom\Enums;

// Computed, not stored — data_room_links has no status column (see the ERD),
// so this is never cast on the model, only returned by DataRoomLink::status().
enum DataRoomLinkStatus: string
{
    case Active = 'active';
    case Expired = 'expired';
    case Revoked = 'revoked';
}
