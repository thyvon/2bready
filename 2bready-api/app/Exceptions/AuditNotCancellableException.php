<?php

declare(strict_types=1);

namespace App\Exceptions;

class AuditNotCancellableException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Only a pending or in-progress audit can be cancelled.');
    }
}
