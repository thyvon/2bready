<?php

declare(strict_types=1);

namespace App\Exceptions;

class TpPartnerHasNoPriceException extends DomainException
{
    public function __construct(string $journeyLevel)
    {
        parent::__construct("This firm has no price set for {$journeyLevel}.");
    }
}
