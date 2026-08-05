<?php

declare(strict_types=1);

namespace App\Exceptions;

class HireNotRateableException extends DomainException
{
    public function __construct(string $reason)
    {
        parent::__construct($reason);
    }
}
