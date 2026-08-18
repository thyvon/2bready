<?php

declare(strict_types=1);

namespace App\Exceptions;

class AuditNotReviewableException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Only a submitted audit can be reviewed.');
    }
}
