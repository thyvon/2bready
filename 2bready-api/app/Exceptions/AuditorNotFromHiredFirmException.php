<?php

declare(strict_types=1);

namespace App\Exceptions;

class AuditorNotFromHiredFirmException extends DomainException
{
    public function __construct()
    {
        parent::__construct('The assigned auditor must belong to the firm hired for this audit.');
    }
}
