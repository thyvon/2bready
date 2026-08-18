<?php

declare(strict_types=1);

namespace App\Domain\LegalConsent\Exceptions;

use App\Exceptions\DomainException;

class LegalConsentNotAcceptedException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Legal consent is required before you can act on restricted documents.');
    }
}
