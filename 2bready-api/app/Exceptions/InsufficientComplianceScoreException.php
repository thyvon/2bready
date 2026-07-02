<?php

declare(strict_types=1);

namespace App\Exceptions;

class InsufficientComplianceScoreException extends DomainException
{
    public function __construct(int $required, int $current)
    {
        parent::__construct("Compliance score {$current} is below the required {$required} to unlock the next level.");
    }
}
