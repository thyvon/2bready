<?php

declare(strict_types=1);

namespace App\Domain\Journey\Enums;

enum JourneyStatus: string
{
    case Active = 'active';
    case Completed = 'completed';
}
