<?php

declare(strict_types=1);

namespace App\Domain\Journey\Exceptions;

use RuntimeException;

class JourneyTemplateNotFoundException extends RuntimeException
{
    public function __construct(string $countryCode, string $industryId)
    {
        parent::__construct(
            "No active journey template found for country '{$countryCode}' and industry '{$industryId}'.",
        );
    }
}
