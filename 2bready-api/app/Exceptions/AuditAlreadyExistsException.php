<?php

declare(strict_types=1);

namespace App\Exceptions;

class AuditAlreadyExistsException extends DomainException
{
    public function __construct()
    {
        parent::__construct('An audit already exists for this hire.');
    }
}
