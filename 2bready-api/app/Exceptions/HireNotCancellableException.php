<?php

declare(strict_types=1);

namespace App\Exceptions;

class HireNotCancellableException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Only pending or active hires can be cancelled.');
    }
}
