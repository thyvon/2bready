<?php

declare(strict_types=1);

namespace App\Exceptions;

class HireNotEditableException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Only hires still awaiting payment can be edited.');
    }
}
