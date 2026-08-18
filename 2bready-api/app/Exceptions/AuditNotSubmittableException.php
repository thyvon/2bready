<?php

declare(strict_types=1);

namespace App\Exceptions;

class AuditNotSubmittableException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Only an in-progress audit with an assigned auditor can be submitted.');
    }
}
