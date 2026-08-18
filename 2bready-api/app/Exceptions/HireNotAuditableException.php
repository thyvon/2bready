<?php

declare(strict_types=1);

namespace App\Exceptions;

class HireNotAuditableException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Only an active or completed hire can be audited.');
    }
}
