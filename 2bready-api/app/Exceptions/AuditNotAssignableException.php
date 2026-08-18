<?php

declare(strict_types=1);

namespace App\Exceptions;

class AuditNotAssignableException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Only a pending audit can be assigned.');
    }
}
