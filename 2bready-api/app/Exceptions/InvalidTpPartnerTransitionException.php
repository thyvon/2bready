<?php

declare(strict_types=1);

namespace App\Exceptions;

class InvalidTpPartnerTransitionException extends DomainException
{
    public function __construct(string $message = 'This status change is not allowed.')
    {
        parent::__construct($message);
    }
}
