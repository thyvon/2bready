<?php

declare(strict_types=1);

namespace App\Domain\Vault\Exceptions;

use App\Exceptions\DomainException;

class InvalidVaultPinException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Incorrect vault PIN.');
    }
}
